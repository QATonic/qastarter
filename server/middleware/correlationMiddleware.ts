/**
 * Correlation ID Middleware for QAStarter
 * 
 * Provides request correlation/tracing across all log entries for a single request.
 * Uses AsyncLocalStorage to automatically attach correlation IDs to all logs
 * within the request context without manual passing.
 */

import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation context stored per-request
 */
export interface CorrelationContext {
    /** Correlation ID - shared across services for distributed tracing */
    correlationId: string;
    /** Request ID - unique to this specific request */
    requestId: string;
    /** Optional trace ID from distributed tracing systems */
    traceId?: string;
    /** Optional span ID for nested operations */
    spanId?: string;
    /** Request start time for duration tracking */
    startTime: number;
    /** Request path */
    path: string;
    /** Request method */
    method: string;
    /** Client IP address */
    ip?: string;
    /** User Agent */
    userAgent?: string;
}

/**
 * AsyncLocalStorage instance for request-scoped correlation context
 */
export const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Generate a short unique ID for request identification
 */
function generateShortId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Express middleware that creates and manages correlation context
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Extract or generate correlation ID
    // Support multiple common header formats
    const correlationId =
        (req.headers['x-correlation-id'] as string) ||
        (req.headers['x-request-id'] as string) ||
        (req.headers['x-trace-id'] as string) ||
        uuidv4();

    // Generate a unique request ID for this specific request
    const requestId = generateShortId();

    // Build correlation context
    const context: CorrelationContext = {
        correlationId,
        requestId,
        traceId: req.headers['x-trace-id'] as string,
        spanId: req.headers['x-span-id'] as string,
        startTime: Date.now(),
        path: req.path,
        method: req.method,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
    };

    // Set response headers for client-side tracing
    res.setHeader('X-Correlation-Id', correlationId);
    res.setHeader('X-Request-Id', requestId);

    // Run the rest of the request handling within the correlation context
    correlationStorage.run(context, () => {
        next();
    });
}

/**
 * Get the current correlation context
 * Returns undefined if called outside of a request context
 */
export function getCorrelationContext(): CorrelationContext | undefined {
    return correlationStorage.getStore();
}

/**
 * Get the current correlation ID
 * Returns 'no-context' if called outside of a request context
 */
export function getCorrelationId(): string {
    return correlationStorage.getStore()?.correlationId || 'no-context';
}

/**
 * Get the current request ID
 * Returns 'no-context' if called outside of a request context
 */
export function getRequestId(): string {
    return correlationStorage.getStore()?.requestId || 'no-context';
}

/**
 * Get request duration in milliseconds
 * Returns 0 if called outside of a request context
 */
export function getRequestDuration(): number {
    const context = correlationStorage.getStore();
    return context ? Date.now() - context.startTime : 0;
}

/**
 * Factory to create a correlation context for background jobs/tasks
 * Useful for scheduled jobs or async operations not triggered by HTTP requests
 */
export function createBackgroundContext(taskName: string): CorrelationContext {
    return {
        correlationId: `bg-${uuidv4()}`,
        requestId: `task-${generateShortId()}`,
        startTime: Date.now(),
        path: `/background/${taskName}`,
        method: 'TASK',
    };
}

/**
 * Run a function within a specific correlation context
 * Useful for background tasks or testing
 */
export function runWithContext<T>(context: CorrelationContext, fn: () => T): T {
    return correlationStorage.run(context, fn);
}

/**
 * Run an async function within a specific correlation context
 * Useful for background tasks or testing
 */
export async function runWithContextAsync<T>(
    context: CorrelationContext,
    fn: () => Promise<T>
): Promise<T> {
    return correlationStorage.run(context, fn);
}
