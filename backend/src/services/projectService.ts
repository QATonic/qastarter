import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';
import { templateService } from './templateService.js';
import { 
  ProjectConfiguration, 
  GeneratedProject, 
  GeneratedFile,
  FileGenerationOptions,
  ZipCreationOptions 
} from '@/types/index.js';

/**
 * Project Generation Service - Handles complete project creation workflow
 */
export class ProjectService {
  private projects: Map<string, GeneratedProject> = new Map();

  /**
   * Generate a complete project from configuration
   */
  async generateProject(configuration: ProjectConfiguration): Promise<GeneratedProject> {
    const projectId = uuidv4();
    const expiresAt = new Date(Date.now() + config.PROJECT_EXPIRY_HOURS * 60 * 60 * 1000);
    
    logger.info(`Starting project generation`, { projectId, configuration });

    // Create initial project record
    const project: GeneratedProject = {
      id: projectId,
      configuration,
      templateId: '',
      status: 'pending',
      progress: 0,
      files: [],
      downloadCount: 0,
      createdAt: new Date(),
      expiresAt
    };

    this.projects.set(projectId, project);

    try {
      // Update status to generating
      project.status = 'generating';
      project.progress = 10;

      // Get appropriate template
      const template = await templateService.getTemplate(configuration);
      project.templateId = template.id;
      project.progress = 20;

      logger.info(`Using template: ${template.id}`, { projectId });

      // Create project directory
      const projectDir = path.join(config.GENERATED_DIR, projectId);
      await fs.ensureDir(projectDir);
      project.progress = 30;

      // Generate files from template
      await templateService.generateFiles(template, configuration, projectDir);
      project.progress = 70;

      // Scan generated files
      project.files = await this.scanGeneratedFiles(projectDir);
      project.progress = 80;

      // Create ZIP archive
      const zipPath = await this.createZipArchive(projectId, projectDir);
      project.zipPath = zipPath;
      project.downloadUrl = `/api/v1/projects/${projectId}/download`;
      project.progress = 100;

      // Mark as completed
      project.status = 'completed';

      logger.info(`Project generation completed`, { 
        projectId, 
        fileCount: project.files.length,
        zipPath
      });

      return project;

    } catch (error) {
      logger.error(`Project generation failed`, { projectId, error });
      
      project.status = 'failed';
      project.error = error instanceof Error ? error.message : String(error);
      
      // Cleanup on failure
      await this.cleanupProject(projectId);
      
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string): GeneratedProject | undefined {
    const project = this.projects.get(projectId);
    
    // Check if project has expired
    if (project && project.expiresAt < new Date()) {
      this.projects.delete(projectId);
      this.cleanupProject(projectId); // Fire and forget cleanup
      return undefined;
    }
    
    return project;
  }

  /**
   * Get project download stream
   */
  async getProjectDownload(projectId: string): Promise<NodeJS.ReadableStream> {
    const project = this.getProject(projectId);
    
    if (!project) {
      throw new Error('Project not found or expired');
    }
    
    if (project.status !== 'completed' || !project.zipPath) {
      throw new Error('Project download not ready');
    }
    
    if (!await fs.pathExists(project.zipPath)) {
      throw new Error('Project file not found');
    }
    
    // Increment download count
    project.downloadCount++;
    
    logger.info(`Project download started`, { 
      projectId, 
      downloadCount: project.downloadCount 
    });
    
    return fs.createReadStream(project.zipPath);
  }

  /**
   * Get project statistics
   */
  getProjectStats(projectId: string): any {
    const project = this.getProject(projectId);
    
    if (!project) {
      throw new Error('Project not found or expired');
    }
    
    return {
      id: project.id,
      status: project.status,
      progress: project.progress,
      templateId: project.templateId,
      fileCount: project.files.length,
      downloadCount: project.downloadCount,
      createdAt: project.createdAt,
      expiresAt: project.expiresAt,
      configuration: {
        projectName: project.configuration.config.projectName,
        language: project.configuration.language,
        framework: project.configuration.tool,
        testRunner: project.configuration.testRunner
      }
    };
  }

  /**
   * Scan generated files to create file metadata
   */
  private async scanGeneratedFiles(projectDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    async function scanDirectory(dir: string, relativePath: string = ''): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(relativePath, entry.name);
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push({
            path: entryPath,
            name: entry.name,
            size: 0,
            checksum: '',
            type: 'directory'
          });
          
          await scanDirectory(fullPath, entryPath);
        } else {
          const stats = await fs.stat(fullPath);
          
          files.push({
            path: entryPath,
            name: entry.name,
            size: stats.size,
            checksum: '', // Could add checksum calculation if needed
            type: 'file'
          });
        }
      }
    }
    
    await scanDirectory(projectDir);
    return files;
  }

  /**
   * Create ZIP archive of generated project
   */
  private async createZipArchive(projectId: string, projectDir: string): Promise<string> {
    const zipPath = path.join(config.TEMP_DIR, `${projectId}.zip`);
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        logger.debug(`ZIP archive created: ${zipPath}`, { 
          projectId, 
          bytes: archive.pointer() 
        });
        resolve(zipPath);
      });

      archive.on('error', (error) => {
        logger.error(`ZIP creation failed`, { projectId, error });
        reject(error);
      });

      archive.on('warning', (warning) => {
        logger.warn(`ZIP creation warning`, { projectId, warning });
      });

      archive.pipe(output);
      
      // Add all files from project directory
      archive.directory(projectDir, false);
      
      archive.finalize();
    });
  }

  /**
   * Clean up project files
   */
  private async cleanupProject(projectId: string): Promise<void> {
    try {
      const projectDir = path.join(config.GENERATED_DIR, projectId);
      const zipPath = path.join(config.TEMP_DIR, `${projectId}.zip`);
      
      // Remove project directory
      if (await fs.pathExists(projectDir)) {
        await fs.remove(projectDir);
        logger.debug(`Cleaned up project directory: ${projectDir}`);
      }
      
      // Remove ZIP file
      if (await fs.pathExists(zipPath)) {
        await fs.remove(zipPath);
        logger.debug(`Cleaned up ZIP file: ${zipPath}`);
      }
      
    } catch (error) {
      logger.warn(`Cleanup failed for project: ${projectId}`, { error });
    }
  }

  /**
   * Periodic cleanup of expired projects
   */
  async cleanupExpiredProjects(): Promise<void> {
    const now = new Date();
    const expiredProjects: string[] = [];
    
    for (const [projectId, project] of this.projects.entries()) {
      if (project.expiresAt < now) {
        expiredProjects.push(projectId);
      }
    }
    
    if (expiredProjects.length > 0) {
      logger.info(`Cleaning up ${expiredProjects.length} expired projects`);
      
      for (const projectId of expiredProjects) {
        this.projects.delete(projectId);
        await this.cleanupProject(projectId);
      }
    }
  }

  /**
   * Get all active projects (for admin/debugging)
   */
  getAllProjects(): GeneratedProject[] {
    return Array.from(this.projects.values());
  }

  /**
   * Force delete a project
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    
    if (!project) {
      return false;
    }
    
    this.projects.delete(projectId);
    await this.cleanupProject(projectId);
    
    logger.info(`Project forcefully deleted: ${projectId}`);
    return true;
  }
}

// Export singleton instance
export const projectService = new ProjectService();

// Schedule periodic cleanup (every hour)
setInterval(() => {
  projectService.cleanupExpiredProjects();
}, 60 * 60 * 1000); 