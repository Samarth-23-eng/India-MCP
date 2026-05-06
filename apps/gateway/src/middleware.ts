import { Request, Response, NextFunction } from 'express';
import { prisma } from './db.js';
import { hashKey } from './auth-utils.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    plan: string;
  };
  apiKeyId?: string;
}

const QUOTAS: Record<string, number> = {
  free: 100,
  pro: 5000,
  enterprise: 100000
};

/**
 * Middleware to authenticate requests via API Key and check quotas.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'API key required. Provide "Authorization: Bearer imcp_sk_..."' });
  }

  const apiKey = authHeader.split(' ')[1];
  const hashed = hashKey(apiKey);

  try {
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash: hashed },
      include: { user: true }
    });

    if (!keyRecord || !keyRecord.active) {
      return res.status(403).json({ success: false, error: 'Invalid or inactive API key.' });
    }

    // --- Quota Check ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usageCount = await prisma.usageLog.count({
      where: {
        userId: keyRecord.userId,
        timestamp: { gte: today }
      }
    });

    const limit = QUOTAS[keyRecord.user.plan] || QUOTAS.free;

    if (usageCount >= limit) {
      return res.status(429).json({ 
        success: false, 
        error: `Quota exceeded (${usageCount}/${limit}). Upgrade to Pro for higher limits.` 
      });
    }

    // Update last used
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() }
    }).catch(console.error);

    req.user = {
      id: keyRecord.user.id,
      email: keyRecord.user.email,
      plan: keyRecord.user.plan
    };
    req.apiKeyId = keyRecord.id;

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]', error);
    res.status(500).json({ success: false, error: 'Authentication service error.' });
  }
}
