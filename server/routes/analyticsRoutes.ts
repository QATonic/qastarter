/**
 * Analytics Routes
 * Endpoints for tracking usage analytics
 */

import { Router } from 'express';
import express from 'express';
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
  '/v1/analytics/events',
  express.json({ limit: '100kb' }),
  asyncHandler(async (req, res) => {
    const { sessionId, events, metadata } = req.body;

    if (!sessionId || typeof sessionId !== 'string' || !events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid analytics payload' },
      });
    }

    // Cap batch size to prevent abuse
    const safeEvents = events.slice(0, 50);

    const deviceType = metadata?.userAgent ? getDeviceType(String(metadata.userAgent)) : 'desktop';

    // Track each event — validate individual event shape
    for (const event of safeEvents) {
      if (!event || typeof event.eventType !== 'string') continue;

      // Cap event.data size to prevent memory abuse (H2 fix)
      let safeData = event.data || {};
      try {
        const dataStr = JSON.stringify(safeData);
        if (dataStr.length > 10000) {
          safeData = { _truncated: true, _originalSize: dataStr.length };
        }
      } catch {
        safeData = {};
      }

      trackEvent(event.eventType.substring(0, 50), sessionId.substring(0, 100), safeData, {
        userAgent:
          typeof metadata?.userAgent === 'string'
            ? metadata.userAgent.substring(0, 200)
            : undefined,
        deviceType,
        referrer:
          typeof metadata?.referrer === 'string' ? metadata.referrer.substring(0, 500) : undefined,
      });
    }

    res.json({ success: true, received: events.length });
  })
);

/**
 * Get aggregated analytics stats
 */
router.get(
  '/v1/analytics/stats',
  asyncHandler(async (req, res) => {
    const stats = await getAnalyticsStats();

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
  '/v1/analytics/session',
  asyncHandler(async (req, res) => {
    const sessionId = generateSessionId();
    res.json({ success: true, sessionId });
  })
);

export default router;
