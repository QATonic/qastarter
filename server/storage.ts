import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { desc, count } from "drizzle-orm";
import { ProjectConfig, projectGenerations } from "@shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

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

export const storage = new DatabaseStorage();