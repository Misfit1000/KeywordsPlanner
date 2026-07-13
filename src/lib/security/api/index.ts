import { Router } from 'express';
import { ApiError } from '../../api/errors';

function asyncJsonRoute(handler: any) {
  return async (req: any, res: any, next: any) => {
    try {
      await handler(req, res, next);
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const securityRouter = Router();


securityRouter.post('/run', asyncJsonRoute(async () => {
  throw new ApiError('LEGACY_AUDIT_ROUTE_REMOVED', 'Use the main audit start route for passive security checks.', 410);
}));
