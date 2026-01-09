/**
 * Analytics Routes
 * Endpoints for tracking usage analytics
 */

import { Router } from 'express';
import { asyncHandler } from '../errors';
import {
  trackEvent,
  getAnalyticsStats,
  getDeviceType,
  generateSessionId,
} from '../services/analyticsService';

const router = Router();

/**
 * Receive analytics events from client
 */
router.post(
  '/events',
  asyncHandler(async (req, res) => {
    const { sessionId, events, metadata } = req.body;

    if (!sessionId || !events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid analytics payload' },
      });
    }

    const deviceType = metadata?.userAgent ? getDeviceType(metadata.userAgent) : 'desktop';

    // Track each event
    for (const event of events) {
      trackEvent(event.eventType, sessionId, event.data || {}, {
        userAgent: metadata?.userAgent?.substring(0, 200),
        deviceType,
        referrer: metadata?.referrer?.substring(0, 500),
      });
    }

    res.json({ success: true, received: events.length });
  })
);

/**
 * Get aggregated analytics stats
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = getAnalyticsStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * Get new session ID
 */
router.get(
  '/session',
  asyncHandler(async (req, res) => {
    const sessionId = generateSessionId();
    res.json({ success: true, sessionId });
  })
);

export default router;
