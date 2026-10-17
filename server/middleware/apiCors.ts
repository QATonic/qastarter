import cors from 'cors';

export function createApiCors(
  options: {
    isDevelopment?: boolean;
    allowedOrigins?: string[];
  } = {}
) {
  const isDevelopment = options.isDevelopment ?? process.env.NODE_ENV !== 'production';
  const allowedOrigins =
    options.allowedOrigins ??
    (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  const allowedPatterns = [
    /^https:\/\/[a-z0-9.-]+\.easypanel\.host$/i,
    /^https:\/\/[a-z0-9.-]+\.qatonic\.com$/i,
  ];

  return cors({
    origin(origin, callback) {
      // Same-origin GETs, health probes and machine clients commonly omit
      // Origin. They need no CORS response headers and are allowed to proceed.
      if (!origin) return callback(null, false);
      callback(
        null,
        isDevelopment ||
          allowedOrigins.includes(origin) ||
          allowedPatterns.some((pattern) => pattern.test(origin))
      );
    },
    credentials: true,
    optionsSuccessStatus: 200,
  });
}
