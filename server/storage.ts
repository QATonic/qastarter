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
    console.warn('⚠️ SSL certificate validation is disabled - this is insecure!');
    return { rejectUnauthorized: false };
  }

  // Prefer proper SSL with optional custom CA
  return {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT || undefined,
  };
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSslConfig(),
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing database pool...`);
  try {
    await pool.end();
    console.log('Database pool closed successfully.');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export pool for testing/manual management if needed
export { pool };

const db = drizzle(pool);
import fs from 'fs/promises';
import path from 'path';
import { logger } from './utils/logger';

// Storage interface for QAStarter
export interface IStorage {
  saveProjectGeneration(config: ProjectConfig): Promise<string>;
  getProjectGenerationStats(): Promise<{
    totalGenerated: number;
    byTestingType: any[];
    byFramework: any[];
    byLanguage: any[];
    recentGenerations: any[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async saveProjectGeneration(config: ProjectConfig): Promise<string> {
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
    byTestingType: any[];
    byFramework: any[];
    byLanguage: any[];
    recentGenerations: any[];
  }> {
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
  private mutex = new Mutex();
  private idCounter = 0;

  // Pre-computed count caches for O(1) stats retrieval
  private countByTestingType: Map<string, number> = new Map();
  private countByFramework: Map<string, number> = new Map();
  private countByLanguage: Map<string, number> = new Map();

  constructor() {
    this.filePath = path.join(process.cwd(), 'server', 'data', 'analytics.json');
    this.init();
  }

  private async init() {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      try {
        const data = await fs.readFile(this.filePath, 'utf-8');
        this.memoryCache = JSON.parse(data);
        // Initialize idCounter from existing data to ensure unique IDs
        this.idCounter = this.memoryCache.reduce((max: number, item: any) =>
          Math.max(max, item.id || 0), 0);
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
  }

  private rebuildCountCaches(): void {
    this.countByTestingType.clear();
    this.countByFramework.clear();
    this.countByLanguage.clear();

    for (const item of this.memoryCache) {
      if (item.testingType) {
        this.countByTestingType.set(item.testingType, (this.countByTestingType.get(item.testingType) || 0) + 1);
      }
      if (item.framework) {
        this.countByFramework.set(item.framework, (this.countByFramework.get(item.framework) || 0) + 1);
      }
      if (item.language) {
        this.countByLanguage.set(item.language, (this.countByLanguage.get(item.language) || 0) + 1);
      }
    }
  }

  private incrementCountCache(config: ProjectConfig): void {
    this.countByTestingType.set(config.testingType, (this.countByTestingType.get(config.testingType) || 0) + 1);
    this.countByFramework.set(config.framework, (this.countByFramework.get(config.framework) || 0) + 1);
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
    // Use mutex to prevent race conditions on concurrent writes
    return this.mutex.runExclusive(async () => {
      if (!this.initialized) await this.init();

      this.idCounter++;
      const record = {
        id: this.idCounter,
        projectName: config.projectName,
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
        testingPattern: config.testingPattern || 'POM',
        testRunner: config.testRunner,
        buildTool: config.buildTool,
        cicdTool: config.cicdTool || null,
        reportingTool: config.reportingTool || null,
        createdAt: new Date().toISOString(),
      };

      this.memoryCache.push(record);
      // Update pre-computed count caches (O(1) operation)
      this.incrementCountCache(config);
      await this.flush();

      return record.id.toString();
    });
  }

  async getProjectGenerationStats(): Promise<{
    totalGenerated: number;
    byTestingType: any[];
    byFramework: any[];
    byLanguage: any[];
    recentGenerations: any[];
  }> {
    if (!this.initialized) await this.init();

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

  async saveProjectGeneration(config: ProjectConfig): Promise<string> {
    try {
      // Check if DB URL is obviously dummy or missing
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:password')) {
        throw new Error('Using default or empty connection string');
      }
      return await this.primary.saveProjectGeneration(config);
    } catch (error) {
      console.warn(
        'Storage: Database save failed, falling back to file system.',
        (error as Error).message
      );
      return await this.fallback.saveProjectGeneration(config);
    }
  }

  async getProjectGenerationStats(): Promise<{
    totalGenerated: number;
    byTestingType: any[];
    byFramework: any[];
    byLanguage: any[];
    recentGenerations: any[];
  }> {
    try {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:password')) {
        throw new Error('Using default or empty connection string');
      }
      return await this.primary.getProjectGenerationStats();
    } catch (error) {
      console.warn(
        'Storage: Database read failed, falling back to file system.',
        (error as Error).message
      );
      return await this.fallback.getProjectGenerationStats();
    }
  }
}

export const storage = new ResilientStorage();
