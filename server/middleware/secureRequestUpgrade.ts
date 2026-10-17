import type { RequestHandler } from 'express';

/** Keep HTTPS upgrades on secure deployments without breaking direct HTTP hosts. */
export const secureRequestUpgrade: RequestHandler = (req, res, next) => {
  if (req.secure) {
    const policy = res.getHeader('Content-Security-Policy');
    if (typeof policy === 'string')
      res.setHeader('Content-Security-Policy', `${policy};upgrade-insecure-requests`);
  }
  next();
};
