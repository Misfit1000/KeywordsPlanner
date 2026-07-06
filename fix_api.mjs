import fs from 'fs';

let content = fs.readFileSync('src/api/index.ts', 'utf8');

const wrapper = `
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

export const apiRouter = Router();
`;

content = content.replace('export const apiRouter = Router();', wrapper);

content = content.replace(/apiRouter\.(get|post)\('([^']+)',\s*(async\s+)?\(req,\s*res\)\s*=>\s*\{/g, (match, method, path, asyncMod) => {
  return "apiRouter." + method + "('" + path + "', asyncJsonRoute(" + (asyncMod || '') + "(req, res) => {";
});

// Fix the closing parentheses.
content = content.replace(/\}\);\n\napiRouter/g, '}));\n\napiRouter');
content = content.replace(/\}\);$/g, '}));');

fs.writeFileSync('src/api/index.ts', content, 'utf8');
