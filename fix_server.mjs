import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Insert the 404 handler before Vite middleware
const fallbackHandler = `
  // Fallback 404 for API routes to always return JSON
  app.use('/api', (req, res) => {
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        error: \`API route not found: \${req.method} \${req.originalUrl}\`
      });
    }
  });

  // Vite middleware for development
`;

content = content.replace('  // Vite middleware for development', fallbackHandler);

fs.writeFileSync('server.ts', content, 'utf8');
