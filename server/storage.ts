import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { desc, count } from "drizzle-orm";
import { ProjectConfig, projectGenerations } from "@shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool);
import fs from "fs/promises";
import path from "path";


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
    const result = await db.insert(projectGenerations).values({
      projectName: config.projectName,
      testingType: config.testingType,
      framework: config.framework,
      language: config.language,
      testingPattern: config.testingPattern,
      testRunner: config.testRunner,
      buildTool: config.buildTool,
      cicdTool: config.cicdTool || null,
      reportingTool: config.reportingTool || null,
    }).returning({ id: projectGenerations.id });

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
        count: count()
      })
      .from(projectGenerations)
      .groupBy(projectGenerations.testingType)
      .orderBy(desc(count()));

    const byFramework = await db
      .select({
        framework: projectGenerations.framework,
        count: count()
      })
      .from(projectGenerations)
      .groupBy(projectGenerations.framework)
      .orderBy(desc(count()))
      .limit(10);

    const byLanguage = await db
      .select({
        language: projectGenerations.language,
        count: count()
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
      } catch (e) {
        this.memoryCache = [];
        await this.flush();
      }
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize FileStorage:", error);
    }
  }

  private async flush() {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.memoryCache, null, 2));
    } catch (error) {
      console.error("Failed to persist analytics:", error);
    }
  }

  async saveProjectGeneration(config: ProjectConfig): Promise<string> {
    if (!this.initialized) await this.init();

    const record = {
      id: this.memoryCache.length + 1,
      projectName: config.projectName,
      testingType: config.testingType,
      framework: config.framework,
      language: config.language,
      testingPattern: config.testingPattern || 'POM',
      testRunner: config.testRunner,
      buildTool: config.buildTool,
      cicdTool: config.cicdTool || null,
      reportingTool: config.reportingTool || null,
      createdAt: new Date().toISOString()
    };

    this.memoryCache.push(record);
    await this.flush(); // Simple append-and-save

    return record.id.toString();
  }

  async getProjectGenerationStats(): Promise<{
    totalGenerated: number;
    byTestingType: any[];
    byFramework: any[];
    byLanguage: any[];
    recentGenerations: any[];
  }> {
    if (!this.initialized) await this.init();

    const data = this.memoryCache;
    const totalGenerated = data.length;

    const countBy = (key: string) => {
      const counts: { [k: string]: number } = {};
      data.forEach((item: any) => {
        const val = item[key];
        if (val) counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([k, v]) => ({ [key]: k, count: v }))
        .sort((a: any, b: any) => b.count - a.count);
    };

    const byTestingType = countBy('testingType').map(i => ({ testingType: i.testingType, count: i.count }));
    const byFramework = countBy('framework').map(i => ({ framework: i.framework, count: i.count }));
    const byLanguage = countBy('language').map(i => ({ language: i.language, count: i.count }));

    const recentGenerations = [...data]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalGenerated,
      byTestingType,
      byFramework,
      byLanguage,
      recentGenerations
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
        throw new Error("Using default or empty connection string");
      }
      return await this.primary.saveProjectGeneration(config);
    } catch (error) {
      console.warn("Storage: Database save failed, falling back to file system.", (error as Error).message);
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
        throw new Error("Using default or empty connection string");
      }
      return await this.primary.getProjectGenerationStats();
    } catch (error) {
      console.warn("Storage: Database read failed, falling back to file system.", (error as Error).message);
      return await this.fallback.getProjectGenerationStats();
    }
  }
}

export const storage = new ResilientStorage();
