import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { desc, count } from 'drizzle-orm';
import { ProjectConfig, projectGenerations } from '@shared/schema';
import { Mutex } from 'async-mutex';

const { Pool } = pg;

// Configure SSL for production with proper certificate validation
// Set DATABASE_CA_CERT env var for custom CA, or DATABASE_SSL_REJECT_UNAUTHORIZED=false to disable (not recommended)
const getSslConfig = () => {
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }

  // Allow explicit opt-out for legacy systems (not recommended)
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
    logger.warn('SSL certificate validation is disabled - this is insecure');
    return { rejectUnauthorized: false };
  }

  // Prefer proper SSL with optional custom CA
  return {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT || undefined,
  };
};

// Only create pool + drizzle when a real DATABASE_URL is configured
const hasDatabase =
  !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('user:password');

const pool = hasDatabase
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: getSslConfig() })
  : null;

if (pool) {
  // Graceful shutdown — let the event loop drain instead of process.exit()
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, closing database pool`);
    try {
      await pool.end();
      logger.info('Database pool closed successfully');
    } catch (error) {
      logger.error('Error closing database pool', { error });
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Export pool for testing/manual management if needed
export { pool };

const db = pool ? drizzle(pool) : null;
import fs from 'fs/promises';
import path from 'path';
import { logger } from './utils/logger';

/** A row from a GROUP BY count query. */
export interface StatCount {
  [key: string]: string | number;
  count: number;
}

// Storage interface for QAStarter
export interface IStorage {
  saveProjectGeneration(config: ProjectConfig): Promise<string>;
  getProjectGenerationStats(): Promise<{
    totalGenerated: number;
    byTestingType: StatCount[];
    byFramework: StatCount[];
    byLanguage: StatCount[];
    recentGenerations: Record<string, any>[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async saveProjectGeneration(config: ProjectConfig): Promise<string> {
    if (!db) throw new Error('Database not configured');
    const result = await db
      .insert(projectGenerations)
      .values({
        projectName: config.projectName,
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
        testingPattern: config.testingPattern,
        testRunner: config.testRunner,
        buildTool: config.buildTool,
        cicdTool: config.cicdTool || null,
        reportingTool: config.reportingTool || null,
      })
      .returning({ id: projectGenerations.id });

    return result[0].id.toString();
  }

  async getProjectGenerationStats(): Promise<{
    totalGenerated: number;
    byTestingType: StatCount[];
    byFramework: StatCount[];
    byLanguage: StatCount[];
    recentGenerations: Record<string, any>[];
  }> {
    if (!db) throw new Error('Database not configured');
    const totalResult = await db.select({ count: count() }).from(projectGenerations);
    const total = totalResult[0]?.count || 0;

    const byTestingType = await db
      .select({
        testingType: projectGenerations.testingType,
        count: count(),
      })
      .from(projectGenerations)
      .groupBy(projectGenerations.testingType)
      .orderBy(desc(count()));

    const byFramework = await db
      .select({
        framework: projectGenerations.framework,
        count: count(),
      })
      .from(projectGenerations)
      .groupBy(projectGenerations.framework)
      .orderBy(desc(count()))
      .limit(10);

    const byLanguage = await db
      .select({
        language: projectGenerations.language,
        count: count(),
      })
      .from(projectGenerations)
      .groupBy(projectGenerations.language)
      .orderBy(desc(count()));

    const recentGenerations = await db
      .select()
      .from(projectGenerations)
      .orderBy(desc(projectGenerations.createdAt))
      .limit(10);

    return {
      totalGenerated: Number(total),
      byTestingType,
      byFramework,
      byLanguage,
      recentGenerations,
    };
  }
}

export class FileStorage implements IStorage {
  private filePath: string;
  private memoryCache: any[] = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private mutex = new Mutex();
  private idCounter = 0;
  private static readonly MAX_RECORDS = 10000;

  // Pre-computed count caches for O(1) stats retrieval
  private countByTestingType: Map<string, number> = new Map();
  private countByFramework: Map<string, number> = new Map();
  private countByLanguage: Map<string, number> = new Map();

  constructor() {
    this.filePath = path.join(process.cwd(), 'server', 'data', 'analytics.json');
    // Fire-and-forget initial load — ensureInitialized() will await properly
    this.initPromise = this.doInit();
  }

  /**
   * Ensures initialization has completed. Safe to call concurrently —
   * all callers await the same promise (the "once" pattern).
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private async doInit(): Promise<void> {
    // Wrap in mutex so concurrent callers don't race on file reads
    await this.mutex.runExclusive(async () => {
      if (this.initialized) return; // Already initialized by a prior call
      try {
        const dir = path.dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true });
        try {
          const data = await fs.readFile(this.filePath, 'utf-8');
          this.memoryCache = JSON.parse(data);
          // Initialize idCounter from existing data to ensure unique IDs
          this.idCounter = this.memoryCache.reduce(
            (max: number, item: any) => Math.max(max, item.id || 0),
            0
          );
          // Pre-compute count caches from existing data
          this.rebuildCountCaches();
        } catch (e) {
          this.memoryCache = [];
          this.idCounter = 0;
          await this.flush();
        }
        this.initialized = true;
      } catch (error) {
        logger.error('Failed to initialize FileStorage', { error });
      }
    });
  }

  private rebuildCountCaches(): void {
    this.countByTestingType.clear();
    this.countByFramework.clear();
    this.countByLanguage.clear();

    for (const item of this.memoryCache) {
      if (item.testingType) {
        this.countByTestingType.set(
          item.testingType,
          (this.countByTestingType.get(item.testingType) || 0) + 1
        );
      }
      if (item.framework) {
        this.countByFramework.set(
          item.framework,
          (this.countByFramework.get(item.framework) || 0) + 1
        );
      }
      if (item.language) {
        this.countByLanguage.set(item.language, (this.countByLanguage.get(item.language) || 0) + 1);
      }
    }
  }

  private incrementCountCache(config: ProjectConfig): void {
    this.countByTestingType.set(
      config.testingType,
      (this.countByTestingType.get(config.testingType) || 0) + 1
    );
    this.countByFramework.set(
      config.framework,
      (this.countByFramework.get(config.framework) || 0) + 1
    );
    this.countByLanguage.set(config.language, (this.countByLanguage.get(config.language) || 0) + 1);
  }

  private async flush() {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.memoryCache, null, 2));
    } catch (error) {
      logger.error('Failed to persist analytics', { error });
    }
  }

  async saveProjectGeneration(config: ProjectConfig): Promise<string> {
    await this.ensureInitialized();
    // Use mutex to prevent race conditions on concurrent writes
    return this.mutex.runExclusive(async () => {
      this.idCounter++;
      const record = {
        id: this.idCounter,
        projectName: config.projectName,
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
        testingPattern: config.testingPattern || 'page-object-model',
        testRunner: config.testRunner,
        buildTool: config.buildTool,
        cicdTool: config.cicdTool || null,
        reportingTool: config.reportingTool || null,
        createdAt: new Date().toISOString(),
      };

      this.memoryCache.push(record);

      // Enforce max records to prevent unbounded memory growth (H1 fix)
      if (this.memoryCache.length > FileStorage.MAX_RECORDS) {
        this.memoryCache = this.memoryCache.slice(-FileStorage.MAX_RECORDS);
        this.rebuildCountCaches(); // Rebuild after trim
      }

      // Update pre-computed count caches (O(1) operation)
      this.incrementCountCache(config);
      await this.flush();

      return record.id.toString();
    });
  }

  async getProjectGenerationStats(): Promise<{
    totalGenerated: number;
    byTestingType: StatCount[];
    byFramework: StatCount[];
    byLanguage: StatCount[];
    recentGenerations: Record<string, any>[];
  }> {
    await this.ensureInitialized();

    const totalGenerated = this.memoryCache.length;

    // Use pre-computed caches for O(1) stats retrieval
    const mapToArray = (map: Map<string, number>, keyName: string) =>
      Array.from(map.entries())
        .map(([key, count]) => ({ [keyName]: key, count }))
        .sort((a, b) => b.count - a.count);

    const byTestingType = mapToArray(this.countByTestingType, 'testingType');
    const byFramework = mapToArray(this.countByFramework, 'framework');
    const byLanguage = mapToArray(this.countByLanguage, 'language');

    // Only recent generations needs full scan (limited to 10 items)
    const recentGenerations = [...this.memoryCache]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalGenerated,
      byTestingType,
      byFramework,
      byLanguage,
      recentGenerations,
    };
  }
}

// Fallback logic could be fancier (try DB, fail to File), but for now,
// since we know DB is likely missing in this dev env, we can check env var or defaulting.
// For robustness, let's wrap the export.
export class ResilientStorage implements IStorage {
  private primary: DatabaseStorage;
  private fallback: FileStorage;

  constructor() {
    this.primary = new DatabaseStorage();
    this.fallback = new FileStorage();
  }

  private get useDatabase(): boolean {
    return hasDatabase;
  }

  async saveProjectGeneration(config: ProjectConfig): Promise<string> {
    if (!this.useDatabase) {
      return await this.fallback.saveProjectGeneration(config);
    }
    try {
      return await this.primary.saveProjectGeneration(config);
    } catch (error) {
      logger.warn('Storage: Database save failed, falling back to file system', {
        error: (error as Error).message,
      });
      return await this.fallback.saveProjectGeneration(config);
    }
  }

  async getProjectGenerationStats(): Promise<{
    totalGenerated: number;
    byTestingType: StatCount[];
    byFramework: StatCount[];
    byLanguage: StatCount[];
    recentGenerations: Record<string, any>[];
  }> {
    if (!this.useDatabase) {
      return await this.fallback.getProjectGenerationStats();
    }
    try {
      return await this.primary.getProjectGenerationStats();
    } catch (error) {
      logger.warn('Storage: Database read failed, falling back to file system', {
        error: (error as Error).message,
      });
      return await this.fallback.getProjectGenerationStats();
    }
  }
}

export const storage = new ResilientStorage();
