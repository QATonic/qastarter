/**
 * Structured Logger for QAStarter
 * 
 * Provides JSON-formatted logging with file rotation,
 * request ID tracking, and appropriate log levels.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '..', '..', 'logs');

// Log levels
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Colors for console output
const LOG_COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(LOG_COLORS);

// Custom format for console (colorized, readable)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        const reqIdStr = requestId ? `[${requestId}]` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${reqIdStr} ${message}${metaStr}`;
    })
);

// Custom format for files (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE === 'true') {
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

// File transports (enabled in production or when explicitly requested)
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE === 'true') {
    // Rotating file for all logs
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            format: fileFormat,
        })
    );

    // Rotating file for errors only
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
            format: fileFormat,
        })
    );
}

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels: LOG_LEVELS,
    transports,
    // Don't exit on uncaught exceptions
    exitOnError: false,
});

// Add console transport in development if no transports exist
if (transports.length === 0) {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

/**
 * Create a child logger with a request ID
 */
export function createRequestLogger(requestId: string): winston.Logger {
    return logger.child({ requestId });
}

/**
 * Log HTTP request (for middleware)
 */
export function logHttpRequest(req: any, res: any, duration: number): void {
    const meta = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection?.remoteAddress,
    };

    if (res.statusCode >= 400) {
        logger.http('HTTP Request Error', meta);
    } else {
        logger.http('HTTP Request', meta);
    }
}

/**
 * Log project generation event
 */
export function logGeneration(
    requestId: string,
    event: 'started' | 'completed' | 'failed',
    details: Record<string, any>
): void {
    const log = createRequestLogger(requestId);

    switch (event) {
        case 'started':
            log.info('Project generation started', details);
            break;
        case 'completed':
            log.info('Project generation completed', details);
            break;
        case 'failed':
            log.error('Project generation failed', details);
            break;
    }
}

/**
 * Log template operation
 */
export function logTemplate(
    operation: 'load' | 'compile' | 'cache-hit' | 'cache-miss',
    details: Record<string, any>
): void {
    logger.debug(`Template ${operation}`, details);
}

/**
 * Log API error
 */
export function logApiError(
    requestId: string,
    error: Error,
    context?: Record<string, any>
): void {
    const log = createRequestLogger(requestId);
    log.error('API Error', {
        message: error.message,
        stack: error.stack,
        ...context,
    });
}

/**
 * Log startup information
 */
export function logStartup(port: number, env: string): void {
    logger.info('Server started', {
        port,
        environment: env,
        logLevel: logger.level,
        nodeVersion: process.version,
    });
}

/**
 * Log shutdown
 */
export function logShutdown(reason?: string): void {
    logger.info('Server shutting down', { reason });
}

// Export default logger
export default logger;
