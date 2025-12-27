import { Request, Response, NextFunction } from 'express';
import { projectService } from '@/services/projectService.js';
import { logger } from '@/utils/logger.js';
import { ApiResponse, ProjectConfiguration } from '@/types/index.js';

/**
 * Project Controller - Handles project-related HTTP requests
 */
export class ProjectController {

  /**
   * Generate a new project
   * POST /api/v1/projects/generate
   */
  async generateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';
      const configuration: ProjectConfiguration = req.body;

      logger.info('Project generation requested', { 
        requestId, 
        projectName: configuration.config.projectName,
        language: configuration.language,
        tool: configuration.tool
      });

      // Generate project asynchronously
      const project = await projectService.generateProject(configuration);

      const response: ApiResponse = {
        success: true,
        data: {
          projectId: project.id,
          status: project.status,
          progress: project.progress,
          downloadUrl: project.downloadUrl,
          expiresAt: project.expiresAt.toISOString(),
          files: project.files.map(file => ({
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.type === 'file' ? file.size : undefined
          }))
        },
        message: 'Project generated successfully',
        timestamp: new Date().toISOString(),
        requestId
      };

      res.status(201).json(response);

    } catch (error) {
      logger.error('Project generation failed', { 
        error: error instanceof Error ? error.message : String(error),
        requestId: (req.headers['x-request-id'] as string) || 'unknown'
      });
      next(error);
    }
  }

  /**
   * Get project status
   * GET /api/v1/projects/:projectId/status
   */
  async getProjectStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';

      if (!projectId) {
        const response: ApiResponse = {
          success: false,
          message: 'Project ID is required',
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(400).json(response);
        return;
      }

      const project = projectService.getProject(projectId);

      if (!project) {
        const response: ApiResponse = {
          success: false,
          message: 'Project not found or expired',
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: project.id,
          status: project.status,
          progress: project.progress,
          templateId: project.templateId,
          downloadUrl: project.downloadUrl,
          downloadCount: project.downloadCount,
          createdAt: project.createdAt.toISOString(),
          expiresAt: project.expiresAt.toISOString(),
          error: project.error
        },
        timestamp: new Date().toISOString(),
        requestId
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Download project ZIP file
   * GET /api/v1/projects/:projectId/download
   */
  async downloadProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';

      if (!projectId) {
        const response: ApiResponse = {
          success: false,
          message: 'Project ID is required',
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(400).json(response);
        return;
      }

      const project = projectService.getProject(projectId);

      if (!project) {
        const response: ApiResponse = {
          success: false,
          message: 'Project not found or expired',
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(404).json(response);
        return;
      }

      if (project.status !== 'completed') {
        const response: ApiResponse = {
          success: false,
          message: `Project not ready for download. Status: ${project.status}`,
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(400).json(response);
        return;
      }

      // Get download stream
      const downloadStream = await projectService.getProjectDownload(projectId);
      
      // Set download headers
      const filename = `${project.configuration.config.projectName}-${projectId.substring(0, 8)}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Project-ID', projectId);

      // Pipe the file stream to response
      downloadStream.pipe(res);

      downloadStream.on('end', () => {
        logger.info('Project download completed', { 
          projectId, 
          filename,
          requestId
        });
      });

      downloadStream.on('error', (error) => {
        logger.error('Project download failed', { 
          projectId, 
          error: error.message,
          requestId
        });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Download failed',
            timestamp: new Date().toISOString(),
            requestId
          });
        }
      });

    } catch (error) {
      logger.error('Project download error', {
        projectId: req.params.projectId,
        error: error instanceof Error ? error.message : String(error),
        requestId: (req.headers['x-request-id'] as string) || 'unknown'
      });
      
      if (!res.headersSent) {
        next(error);
      }
    }
  }

  /**
   * Get project files list
   * GET /api/v1/projects/:projectId/files
   */
  async getProjectFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';

      if (!projectId) {
        const response: ApiResponse = {
          success: false,
          message: 'Project ID is required',
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(400).json(response);
        return;
      }

      const project = projectService.getProject(projectId);

      if (!project) {
        const response: ApiResponse = {
          success: false,
          message: 'Project not found or expired',
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          projectId: project.id,
          fileCount: project.files.length,
          files: project.files.map(file => ({
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.type === 'file' ? file.size : undefined
          }))
        },
        timestamp: new Date().toISOString(),
        requestId
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a project
   * DELETE /api/v1/projects/:projectId
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';

      if (!projectId) {
        const response: ApiResponse = {
          success: false,
          message: 'Project ID is required',
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await projectService.deleteProject(projectId);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Project not found',
          timestamp: new Date().toISOString(),
          requestId
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Project deleted successfully',
        timestamp: new Date().toISOString(),
        requestId
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all projects (admin endpoint)
   * GET /api/v1/projects
   */
  async getAllProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';
      const projects = projectService.getAllProjects();

      const response: ApiResponse = {
        success: true,
        data: {
          count: projects.length,
          projects: projects.map(project => ({
            id: project.id,
            status: project.status,
            progress: project.progress,
            templateId: project.templateId,
            downloadCount: project.downloadCount,
            createdAt: project.createdAt.toISOString(),
            expiresAt: project.expiresAt.toISOString(),
            configuration: {
              projectName: project.configuration.config.projectName,
              language: project.configuration.language,
              tool: project.configuration.tool,
              testRunner: project.configuration.testRunner
            }
          }))
        },
        timestamp: new Date().toISOString(),
        requestId
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const projectController = new ProjectController(); 