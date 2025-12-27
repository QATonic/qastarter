import { validateConfig } from '@/utils/config.js';
import { startServer } from '@/app.js';
import { logger } from '@/utils/logger.js';

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated successfully');

    // Ensure required directories exist
    const fs = await import('fs-extra');
    const configModule = await import('@/utils/config.js');
    fs.ensureDirSync(configModule.config.TEMP_DIR);
    fs.ensureDirSync(configModule.config.GENERATED_DIR);
    fs.ensureDirSync(configModule.config.TEMPLATES_DIR);
    fs.ensureDirSync('./logs');

    // Start the server
    await startServer();

  } catch (error) {
    logger.error('Failed to start application', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { 
    error: error.message, 
    stack: error.stack 
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { 
    reason: String(reason),
    promise: String(promise)
  });
  process.exit(1);
});

// Start the application
main(); 