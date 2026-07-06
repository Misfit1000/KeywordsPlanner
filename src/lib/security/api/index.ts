import { Router } from 'express';
import { runSecurityAudit } from '../audit-runner';


function asyncJsonRoute(handler: any) {
  return async (req: any, res: any, next: any) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  };
}

export const securityRouter = Router();


securityRouter.post('/run', asyncJsonRoute(async (req, res) => {
  try {
    const { url, options } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });
    
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    
    const auditResult = await runSecurityAudit(targetUrl, options);
    res.json({ success: true, data: auditResult });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}));
