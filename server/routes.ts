import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import archiver from "archiver";
import { storage } from "./storage";
import { projectConfigSchema, type ProjectConfig } from "@shared/schema";
import { ProjectTemplateGenerator } from "./templates";
import { WizardValidator, validationMatrix, validationLabels } from "@shared/validationMatrix";
import { sanitizeProjectName, sanitizeGroupId, sanitizeArtifactId, sanitizeFilePath } from "@shared/sanitize";
import { 
  AppError, 
  ValidationError, 
  IncompatibleCombinationError,
  ErrorCode, 
  generateRequestId,
  asyncHandler 
} from "./errors";

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: "Too many requests from this IP, please try again later.",
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const generateProjectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit project generation to 10 per 15 minutes per IP
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: "Too many project generation requests. Please try again in 15 minutes.",
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
});

export async function registerRoutes(app: Express): Promise<Server> {
  const templateGenerator = new ProjectTemplateGenerator();
  
  // Apply rate limiting to all API routes
  app.use('/api/', apiLimiter);

  // Generate and download project (with stricter rate limiting)
  app.post("/api/generate-project", generateProjectLimiter, asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const requestId = generateRequestId('gen');
    
    // Validate request body
    const validationResult = projectConfigSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      throw new ValidationError('Invalid project configuration', errors, requestId);
    }

    const config: ProjectConfig = validationResult.data;

    // Sanitize user inputs to prevent path traversal and injection attacks
    config.projectName = sanitizeProjectName(config.projectName);
    if (config.groupId) {
      config.groupId = sanitizeGroupId(config.groupId);
    }
    if (config.artifactId) {
      config.artifactId = sanitizeArtifactId(config.artifactId);
    }

    // Log generation request
    console.log(`[${requestId}] Project generation started`);
    console.log(`[${requestId}] Configuration:`, {
      projectName: config.projectName,
      testingType: config.testingType,
      framework: config.framework,
      language: config.language,
      testRunner: config.testRunner,
      buildTool: config.buildTool,
      cicdTool: config.cicdTool || 'none',
      reportingTool: config.reportingTool || 'none',
      utilities: config.utilities 
        ? Object.entries(config.utilities).filter(([_, enabled]) => enabled).map(([key, _]) => key)
        : []
    });

    // Validate compatibility using our validation matrix
    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType, 
        config.framework, 
        config.language, 
        requestId
      );
    }

    // Generate project files using sophisticated template pack engine
    const generationStart = Date.now();
    let files;
    try {
      files = await templateGenerator.generateProject(config);
    } catch (genError) {
      throw new AppError(
        ErrorCode.TEMPLATE_GENERATION_ERROR,
        'Failed to generate project files',
        { originalError: genError instanceof Error ? genError.message : 'Unknown error' },
        requestId
      );
    }
    const generationDuration = Date.now() - generationStart;

    // Calculate total project size
    const totalSize = files.reduce((sum, file) => sum + Buffer.byteLength(file.content, 'utf8'), 0);
    const sizeInKB = (totalSize / 1024).toFixed(2);

    console.log(`[${requestId}] Template generation completed:`, {
      filesGenerated: files.length,
      sizeKB: sizeInKB,
      durationMs: generationDuration
    });

    // Save generation for analytics (non-blocking)
    try {
      await storage.saveProjectGeneration(config);
    } catch (analyticsError) {
      console.warn(`[${requestId}] Analytics save failed:`, analyticsError);
      // Continue with project generation even if analytics fails
    }

    // Create ZIP archive
    const archiveStart = Date.now();
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${config.projectName}.zip"`);

    // Handle archive errors
    archive.on('error', (err: Error) => {
      console.error(`[${requestId}] Archive error:`, err);
      if (!res.headersSent) {
        const archiveError = new AppError(ErrorCode.ARCHIVE_ERROR, 'Error creating project archive', null, requestId);
        res.status(archiveError.statusCode).json(archiveError.toJSON());
      }
    });

    // Track archive completion
    archive.on('end', () => {
      const totalDuration = Date.now() - startTime;
      const archiveDuration = Date.now() - archiveStart;
      console.log(`[${requestId}] ✅ Project generation successful:`, {
        projectName: config.projectName,
        files: files.length,
        sizeKB: sizeInKB,
        generationMs: generationDuration,
        archiveMs: archiveDuration,
        totalMs: totalDuration
      });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add files to archive
    files.forEach(file => {
      archive.append(file.content, { name: file.path });
    });

    // Finalize the archive
    await archive.finalize();
  }));

  // Get project generation stats (for analytics)
  app.get("/api/stats", asyncHandler(async (req, res) => {
    const stats = await storage.getProjectGenerationStats();
    res.json({
      success: true,
      data: stats
    });
  }));

  // GET /api/v1/config/options - Get wizard configuration options
  app.get("/api/v1/config/options", (req, res) => {
    const requestId = generateRequestId('config');
    const options = {
      testingTypes: ['Web', 'API', 'Mobile', 'Desktop'],
      methodologies: ['TDD', 'BDD', 'Hybrid'],
      tools: [
        'Selenium', 'Playwright', 'Cypress', 'WebdriverIO',
        'RestAssured', 'Requests', 'Supertest', 'RestSharp',
        'Appium', 'XCUITest', 'Espresso',
        'WinAppDriver', 'PyAutoGUI'
      ],
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift'],
      buildTools: ['Maven', 'Gradle', 'npm', 'pip', 'NuGet', 'SPM'],
      testRunners: ['JUnit 5', 'TestNG', 'Pytest', 'Jest', 'Mocha', 'NUnit', 'XCTest', 'Cypress'],
      scenarios: {
        Web: ['Login', 'Logout', 'SignUp', 'Search', 'Navigation', 'Form Validation'],
        API: ['CRUD Operations', 'Authentication', 'Error Handling', 'Schema Validation', 'Rate Limiting'],
        Mobile: ['Login', 'Logout', 'SignUp', 'Navigation', 'Push Notifications', 'Gestures', 'Device Rotation'],
        Desktop: ['Login', 'File Operations', 'Menu Navigation', 'Form Validation', 'Window Management']
      },
      cicdOptions: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'Azure DevOps', 'CircleCI'],
      reportingOptions: ['Allure Reports', 'Extent Reports', 'TestNG Reports', 'JUnit Reports', 'Pytest HTML', 'Mochawesome'],
      otherIntegrations: ['Docker', 'Selenium Grid', 'BrowserStack', 'Sauce Labs'],
      dependencies: ['Logging', 'Screenshot', 'Config Loader', 'Page Object Model', 'Data Provider', 'Retry Logic', 'Wait Helpers']
    };

    res.json({
      success: true,
      data: options,
      timestamp: new Date().toISOString(),
      requestId
    });
  });

  // GET /api/v1/config/filters - Get filter rules for wizard
  app.get("/api/v1/config/filters", (req, res) => {
    const requestId = generateRequestId('filters');
    const filters = {
      testingType: {
        'Web': {
          tools: ['Selenium', 'Playwright', 'Cypress', 'WebdriverIO'],
          languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
        },
        'API': {
          tools: ['RestAssured', 'Requests', 'Supertest', 'RestSharp'],
          languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
        },
        'Mobile': {
          tools: ['Appium', 'XCUITest', 'Espresso'],
          languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift']
        },
        'Desktop': {
          tools: ['WinAppDriver', 'PyAutoGUI'],
          languages: ['Java', 'Python', 'C#']
        }
      },
      tool: {
        'Selenium': { languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'] },
        'Playwright': { languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'] },
        'Cypress': { languages: ['JavaScript', 'TypeScript'] },
        'WebdriverIO': { languages: ['JavaScript', 'TypeScript'] },
        'RestAssured': { languages: ['Java'] },
        'Requests': { languages: ['Python'] },
        'Supertest': { languages: ['JavaScript', 'TypeScript'] },
        'RestSharp': { languages: ['C#'] },
        'Appium': { languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'] },
        'XCUITest': { languages: ['Swift'] },
        'Espresso': { languages: ['Java'] },
        'WinAppDriver': { languages: ['Java', 'Python', 'C#'] },
        'PyAutoGUI': { languages: ['Python'] }
      },
      language: {
        'Java': { buildTools: ['Maven', 'Gradle'], testRunners: ['JUnit 5', 'TestNG'] },
        'Python': { buildTools: ['pip'], testRunners: ['Pytest'] },
        'JavaScript': { buildTools: ['npm'], testRunners: ['Jest', 'Mocha', 'Cypress'] },
        'TypeScript': { buildTools: ['npm'], testRunners: ['Jest', 'Mocha', 'Cypress'] },
        'C#': { buildTools: ['NuGet'], testRunners: ['NUnit'] },
        'Swift': { buildTools: ['SPM'], testRunners: ['XCTest'] }
      },
      toolLanguage: {
        'Selenium-Java': { testRunners: ['TestNG', 'JUnit 5'], buildTools: ['Maven', 'Gradle'] },
        'Selenium-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
        'Selenium-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
        'Selenium-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
        'Selenium-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
        'Playwright-Java': { testRunners: ['TestNG', 'JUnit 5'], buildTools: ['Maven', 'Gradle'] },
        'Playwright-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
        'Playwright-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
        'Playwright-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
        'Playwright-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
        'Cypress-JavaScript': { testRunners: ['Cypress'], buildTools: ['npm'] },
        'Cypress-TypeScript': { testRunners: ['Cypress'], buildTools: ['npm'] },
        'WebdriverIO-JavaScript': { testRunners: ['Mocha'], buildTools: ['npm'] },
        'WebdriverIO-TypeScript': { testRunners: ['Mocha'], buildTools: ['npm'] },
        'RestAssured-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
        'Requests-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
        'Supertest-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
        'Supertest-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
        'RestSharp-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
        'Appium-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
        'Appium-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
        'Appium-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
        'Appium-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
        'Appium-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
        'Espresso-Java': { testRunners: ['JUnit 5'], buildTools: ['Gradle'] },
        'XCUITest-Swift': { testRunners: ['XCTest'], buildTools: ['SPM'] },
        'WinAppDriver-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
        'WinAppDriver-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
        'WinAppDriver-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
        'PyAutoGUI-Python': { testRunners: ['Pytest'], buildTools: ['pip'] }
      }
    };

    res.json({
      success: true,
      data: filters,
      timestamp: new Date().toISOString(),
      requestId
    });
  });

  // Validate project configuration
  app.post("/api/validate-config", (req, res) => {
    const validationResult = projectConfigSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.json({
        isValid: false,
        message: "Invalid configuration",
        errors: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    const config: ProjectConfig = validationResult.data;
    
    // Validate compatibility using our validation matrix
    const isValid = WizardValidator.isCompatible(config.testingType, config.framework, config.language);
    
    res.json({
      isValid,
      message: isValid ? "Configuration is valid" : "Invalid combination of testing type, framework, and language"
    });
  });

  // Get project dependencies based on configuration
  app.post("/api/project-dependencies", asyncHandler(async (req, res) => {
    const requestId = generateRequestId('deps');
    
    // Validate request body
    const validationResult = projectConfigSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      throw new ValidationError('Invalid project configuration', errors, requestId);
    }

    const config: ProjectConfig = validationResult.data;

    // Validate compatibility using our validation matrix
    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

    // Get dependencies from the template pack manifest
    const dependencies = await templateGenerator.getDependencies(config);

    res.json({
      success: true,
      data: {
        dependencies,
        buildTool: config.buildTool,
        language: config.language
      }
    });
  }));

  // Get project preview (structure and sample files) based on configuration
  app.post("/api/project-preview", asyncHandler(async (req, res) => {
    const requestId = generateRequestId('preview');
    
    // Validate request body
    const validationResult = projectConfigSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      throw new ValidationError('Invalid project configuration', errors, requestId);
    }

    const config: ProjectConfig = validationResult.data;

    // Validate compatibility using our validation matrix
    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

    // Generate project files for preview (same as actual generation)
    const files = await templateGenerator.generateProject(config);

      // Transform files into preview structure
      interface PreviewFile {
        name: string;
        type: 'file' | 'folder';
        content?: string;
        children?: PreviewFile[];
      }

      // Build file tree structure
      const buildFileTree = (files: any[]): PreviewFile[] => {
        const tree: { [key: string]: any } = {};
        
        // Sort files to process folders first
        const sortedFiles = files.sort((a, b) => {
          const aDepth = a.path.split('/').length;
          const bDepth = b.path.split('/').length;
          return aDepth - bDepth;
        });

        sortedFiles.forEach(file => {
          const pathParts = file.path.split('/');
          let currentLevel = tree;
          
          pathParts.forEach((part: string, index: number) => {
            if (index === pathParts.length - 1) {
              // It's a file
              currentLevel[part] = {
                name: part,
                type: 'file',
                content: file.content
              };
            } else {
              // It's a folder
              if (!currentLevel[part]) {
                currentLevel[part] = {
                  name: part,
                  type: 'folder',
                  children: {}
                };
              }
              currentLevel = currentLevel[part].children;
            }
          });
        });

        // Convert tree object to array format
        const convertToArray = (obj: any): PreviewFile[] => {
          return Object.values(obj).map((item: any) => {
            if (item.type === 'folder' && item.children) {
              return {
                ...item,
                children: convertToArray(item.children)
              };
            }
            return item;
          });
        };

        // Create root project folder
        return [{
          name: config.projectName,
          type: 'folder' as const,
          children: convertToArray(tree)
        }];
      };

      const projectStructure = buildFileTree(files);

      // Get sample file contents for key files (limit to prevent huge responses)
      const sampleFiles = files
        .filter(file => {
          const fileName = file.path.split('/').pop()?.toLowerCase() || '';
          return fileName.includes('pom.xml') || 
                 fileName.includes('readme') || 
                 fileName.includes('test') ||
                 fileName.includes('base') ||
                 fileName.includes('page') ||
                 fileName.includes('config');
        })
        .slice(0, 8) // Limit to 8 sample files
        .map(file => ({
          path: file.path,
          content: file.content.substring(0, 2000) + (file.content.length > 2000 ? '\n\n... (content truncated for preview)' : '')
        }));

      // Calculate estimated project size
      const estimatedSize = files.reduce((total, file) => {
        return total + (file.content?.length || 0);
      }, 0);

      // Identify key files (tests, configs, README)
      const keyFiles = files
        .filter(file => {
          const fileName = file.path.split('/').pop()?.toLowerCase() || '';
          const path = file.path.toLowerCase();
          return path.includes('test') || 
                 fileName.includes('readme') ||
                 fileName.includes('pom.xml') ||
                 fileName.includes('build.gradle') ||
                 fileName.includes('package.json') ||
                 fileName.includes('requirements.txt') ||
                 fileName.includes('config') ||
                 fileName.includes('.csproj') ||
                 fileName.includes('jenkinsfile') ||
                 fileName.includes('.yml') ||
                 fileName.includes('.yaml');
        })
        .map(file => ({
          path: file.path,
          type: file.path.toLowerCase().includes('test') ? 'test' : 
                file.path.toLowerCase().includes('readme') ? 'documentation' :
                'configuration'
        }));

      // Get actual dependency count from template manifest (filtered by user selections)
      const dependencies = await templateGenerator.getDependencies(config);
      const dependencyCount = Object.keys(dependencies).length;

      res.json({
        success: true,
        data: {
          projectStructure,
          sampleFiles,
          totalFiles: files.length,
          estimatedSize: Math.ceil(estimatedSize / 1024), // Convert to KB
          keyFiles,
          dependencyCount,
          projectConfig: config
        }
      });
  }));

  // ============ Public API v1 Routes ============
  // These endpoints are designed for CLI tools, curl usage, and third-party integrations
  
  // GET /api/v1/metadata - List available options for project generation
  app.get("/api/v1/metadata", (req, res) => {
    // Build metadata response with all available options and compatibility info
    const metadata = {
      version: "1.0.0",
      testingTypes: validationMatrix.testingTypes.map(type => ({
        id: type,
        label: validationLabels.testingTypes[type as keyof typeof validationLabels.testingTypes] || type,
        frameworks: validationMatrix.frameworks[type] || []
      })),
      frameworks: Object.entries(validationLabels.frameworks).map(([id, label]) => ({
        id,
        label,
        languages: validationMatrix.languages[id] || [],
        cicdTools: validationMatrix.cicdTools[id] || [],
        reportingTools: validationMatrix.reportingTools[id] || [],
        testingPatterns: validationMatrix.testingPatterns[id] || []
      })),
      languages: Object.entries(validationLabels.languages).map(([id, label]) => ({
        id,
        label,
        testRunners: validationMatrix.testRunners[id] || [],
        buildTools: validationMatrix.buildTools[id] || []
      })),
      testRunners: Object.entries(validationLabels.testRunners).map(([id, label]) => ({ id, label })),
      buildTools: Object.entries(validationLabels.buildTools).map(([id, label]) => ({ id, label })),
      cicdTools: Object.entries(validationLabels.cicdTools).map(([id, label]) => ({ id, label })),
      reportingTools: Object.entries(validationLabels.reportingTools).map(([id, label]) => ({ id, label })),
      testingPatterns: Object.entries(validationLabels.testingPatterns).map(([id, label]) => ({ id, label })),
      utilities: [
        { id: 'configReader', label: 'Config Reader', description: 'Configuration file reader utility' },
        { id: 'jsonReader', label: 'JSON Reader', description: 'JSON file parsing utility' },
        { id: 'screenshotUtility', label: 'Screenshot Utility', description: 'Screenshot capture on failure' },
        { id: 'logger', label: 'Logger', description: 'Structured logging configuration' },
        { id: 'dataProvider', label: 'Data Provider', description: 'Data-driven testing utilities' }
      ]
    };

    res.json({
      success: true,
      data: metadata
    });
  });

  // GET /api/v1/generate - Generate project with query parameters (for curl/CLI usage)
  app.get("/api/v1/generate", generateProjectLimiter, asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const requestId = generateRequestId('api-gen');
    
    // Extract query parameters
    const {
      projectName = 'my-qa-project',
      testingType: testingTypeParam = 'web',
        framework = 'selenium',
        language = 'java',
        testRunner,
        buildTool,
        testingPattern = 'page-object-model',
        cicdTool,
        reportingTool,
        includeSampleTests = 'true',
        // Utilities as comma-separated string
        utilities: utilitiesParam
      } = req.query as Record<string, string>;

      // Validate and cast testingType
      const validTestingTypes = ['web', 'mobile', 'api', 'desktop'] as const;
      const testingType = validTestingTypes.includes(testingTypeParam as any) 
        ? (testingTypeParam as 'web' | 'mobile' | 'api' | 'desktop')
        : 'web';

      // Parse utilities - map to schema-compatible field names
      const utilitiesArray = utilitiesParam ? utilitiesParam.split(',').map(u => u.trim()) : [];
      const utilities = {
        configReader: utilitiesArray.includes('configReader'),
        jsonReader: utilitiesArray.includes('jsonReader'),
        screenshotUtility: utilitiesArray.includes('screenshotUtility') || utilitiesArray.includes('screenshot'),
        logger: utilitiesArray.includes('logger') || utilitiesArray.includes('logging'),
        dataProvider: utilitiesArray.includes('dataProvider') || utilitiesArray.includes('dataDriver')
      };

      // Auto-select test runner and build tool if not provided
      const availableTestRunners = WizardValidator.getAvailableTestRunners(language);
      const availableBuildTools = WizardValidator.getAvailableBuildTools(language);
      
      const finalTestRunner = testRunner || availableTestRunners[0] || 'testng';
      const finalBuildTool = buildTool || availableBuildTools[0] || 'maven';

      // Build config object
      const config: ProjectConfig = {
        projectName,
        testingType,
        framework,
        language,
        testRunner: finalTestRunner,
        buildTool: finalBuildTool,
        testingPattern,
        cicdTool: cicdTool || undefined,
        reportingTool: reportingTool || undefined,
        utilities,
        includeSampleTests: includeSampleTests !== 'false'
      };

      // Validate config
      const validationResult = projectConfigSchema.safeParse(config);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        throw new ValidationError('Invalid configuration', errors, requestId);
      }

      // Sanitize user inputs to prevent path traversal and injection attacks
      config.projectName = sanitizeProjectName(config.projectName);

      // Log generation request
      console.log(`[${requestId}] Public API project generation started`);
      console.log(`[${requestId}] Configuration:`, {
        projectName: config.projectName,
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
        testRunner: config.testRunner,
        buildTool: config.buildTool,
        cicdTool: config.cicdTool || 'none',
        reportingTool: config.reportingTool || 'none'
      });

      // Validate compatibility
      if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
        throw new IncompatibleCombinationError(
          config.testingType,
          config.framework,
          config.language,
          requestId
        );
      }

      // Generate project files
      const generationStart = Date.now();
      let files;
      try {
        files = await templateGenerator.generateProject(config);
      } catch (genError) {
        throw new AppError(
          ErrorCode.TEMPLATE_GENERATION_ERROR,
          'Failed to generate project files',
          { originalError: genError instanceof Error ? genError.message : 'Unknown error' },
          requestId
        );
      }
      const generationDuration = Date.now() - generationStart;

      // Calculate total project size
      const totalSize = files.reduce((sum, file) => sum + Buffer.byteLength(file.content, 'utf8'), 0);
      const sizeInKB = (totalSize / 1024).toFixed(2);

      console.log(`[${requestId}] Template generation completed:`, {
        filesGenerated: files.length,
        sizeKB: sizeInKB,
        durationMs: generationDuration
      });

      // Save generation for analytics
      try {
        await storage.saveProjectGeneration(config);
      } catch (analyticsError) {
        console.warn(`[${requestId}] Analytics save failed:`, analyticsError);
      }

      // Create ZIP archive
      const archiveStart = Date.now();
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${config.projectName}.zip"`);

      // Handle archive errors
      archive.on('error', (err: Error) => {
        console.error(`[${requestId}] Archive error:`, err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error creating project archive"
          });
        }
      });

      // Track archive completion
      archive.on('end', () => {
        const totalDuration = Date.now() - startTime;
        const archiveDuration = Date.now() - archiveStart;
        console.log(`[${requestId}] ✅ Public API project generation successful:`, {
          projectName: config.projectName,
          files: files.length,
          sizeKB: sizeInKB,
          generationMs: generationDuration,
          archiveMs: archiveDuration,
          totalMs: totalDuration
        });
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add files to archive
      files.forEach(file => {
        archive.append(file.content, { name: file.path });
      });

      // Finalize the archive
      await archive.finalize();
  }));

  const httpServer = createServer(app);
  return httpServer;
}

// Validation is now handled by WizardValidator from the validation matrix