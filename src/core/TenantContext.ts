import { Request, Response, NextFunction } from 'express';
import { SecurityCache } from './SecurityCache';

/**
 * Enterprise Multi-tenancy Context
 * Encapsulates the current request's tenant (ULB) information.
 */
export class TenantContext {
  private static readonly ULB_HEADER = 'x-ulb-id';

  /**
   * Middleware to extract and set the ULB Context
   */
  static async middleware(req: Request, res: Response, next: NextFunction) {
    const ulbIdHeader = req.headers[TenantContext.ULB_HEADER];

    // For Global/SuperAdmin routes, ULB ID might be optional
    // For Workspace routes, it's mandatory
    if (ulbIdHeader) {
      const ulbId = parseInt(ulbIdHeader as string, 10);
      if (isNaN(ulbId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ULB ID provided in headers.'
        });
      }

      // Enterprise Kill-Switch: Verify ULB is active
      const isUlbActive = await SecurityCache.isUlbActive(ulbId);
      if (!isUlbActive) {
        return res.status(403).json({
          success: false,
          message: 'WORKSPACE_SUSPENDED'
        });
      }

      (req as any).ulbId = ulbId;
    }

    next();
  }

  /**
   * Utility to get current ULB ID from request
   */
  static getUlbId(req: Request): number | undefined {
    return req.ulbId;
  }
}
