import winston from 'winston';
import { config } from '@/utils/config.js';

/**
 * Custom log levels
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Custom colors for different log levels
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

/**
 * Determine the log level based on environment
 */
const level = (): string => {
  const env = config.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

/**
 * Define format for logs
 */
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

/**
 * Define which transports the logger must use
 */
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    ),
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    ),
  }),
];

/**
 * Create the logger instance
 */
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

/**
 * Morgan stream for HTTP logging
 */
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Log error with context
 */
export const logError = (error: Error, context?: Record<string, any>): void => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context,
  });
};

/**
 * Log info with context
 */
export const logInfo = (message: string, context?: Record<string, any>): void => {
  logger.info(message, context);
};

/**
 * Log warning with context
 */
export const logWarn = (message: string, context?: Record<string, any>): void => {
  logger.warn(message, context);
};

/**
 * Log debug information
 */
export const logDebug = (message: string, context?: Record<string, any>): void => {
  logger.debug(message, context);
}; 