import { Router } from 'express';
import { runSecurityAudit } from '../audit-runner';

export const securityRouter = Router();

securityRouter.post('/run', async (req, res) => {
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
});
