import { ProjectConfig } from '@shared/schema';
import { ProjectTemplateGenerator, TemplateFile } from '../templates';
import { storage } from '../storage';
import { logGeneration } from '../utils/logger';
import { sanitizeFilename } from '@shared/sanitize';
import archiver from 'archiver';
import path from 'path';
import { Response } from 'express';

/**
 * Service to handle project generation orchestration
 */
export class ProjectService {
  private templateGenerator: ProjectTemplateGenerator;

  constructor() {
    // Use process.cwd() for robust path resolution (Dev vs Docker)
    const templatesPath = path.join(process.cwd(), 'server', 'templates', 'packs');
    this.templateGenerator = new ProjectTemplateGenerator(templatesPath);
  }

  /**
   * Generate project, track analytics, and stream zip to response
   */
  public async generateAndStreamProject(
    config: ProjectConfig,
    res: Response,
    requestId: string,
    reqLogger: any
  ): Promise<void> {
    const startTime = Date.now();

    // Log start
    logGeneration(requestId, 'started', {
      projectName: config.projectName,
      testingType: config.testingType,
      framework: config.framework,
      language: config.language,
    });

    // Save analytics (non-blocking)
    storage.saveProjectGeneration(config).catch((err) => {
      reqLogger.warn('Analytics save failed', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    });

    // Setup Archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Max compression
    });

    // Set Headers with sanitized filename (RFC 5987 encoding for safety)
    const safeName = sanitizeFilename(config.projectName);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}.zip"; filename*=UTF-8''${encodeURIComponent(safeName)}.zip`
    );
    // Track error state to prevent double response handling
    let hasErrored = false;

    // Handle archive errors
    archive.on('error', (err: Error) => {
      hasErrored = true;
      reqLogger.error('Archive error', { error: err.message });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Archive creation failed' });
      } else if (!res.writableEnded) {
        // Properly destroy the stream to signal failure to client
        res.destroy(err);
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Stream generation
    let fileCount = 0;
    let totalSize = 0;
    const streamStart = Date.now();

    try {
      // Consume the generator
      for await (const file of this.templateGenerator.generateProjectStream(config)) {
        archive.append(file.content, { name: file.path });
        fileCount++;
        totalSize += Buffer.byteLength(file.content, 'utf8');
      }

      await archive.finalize();

      // Log completion
      const sizeKB = (totalSize / 1024).toFixed(2);
      const durationMs = Date.now() - streamStart;

      logGeneration(requestId, 'completed', {
        projectName: config.projectName,
        files: fileCount,
        sizeKB: sizeKB,
        totalMs: Date.now() - startTime,
      });

      reqLogger.debug('Streamed generation completed', { files: fileCount, durationMs });
    } catch (error) {
      // Only handle if archive error handler didn't already respond
      if (!hasErrored) {
        reqLogger.error('Streaming generation failed', { error });
        archive.abort();
        if (!res.headersSent) {
          throw error; // Let controller handle it
        } else if (!res.writableEnded) {
          res.destroy(error as Error);
        }
      }
    }
  }

  /**
   * Get project dependencies
   */
  public async getDependencies(config: ProjectConfig) {
    return this.templateGenerator.getDependencies(config);
  }

  /**
   * Generate preview (non-streaming, lightweight)
   */
  public async generatePreview(config: ProjectConfig) {
    return this.templateGenerator.generateProject(config);
  }
}

export const projectService = new ProjectService();
