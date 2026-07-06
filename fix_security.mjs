import fs from 'fs';

let content = fs.readFileSync('src/lib/security/api/index.ts', 'utf8');

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

export const securityRouter = Router();
`;

content = content.replace('export const securityRouter = Router();', wrapper);

content = content.replace(/securityRouter\.(get|post)\('([^']+)',\s*(async\s+)?\(req,\s*res\)\s*=>\s*\{/g, (match, method, path, asyncMod) => {
  return "securityRouter." + method + "('" + path + "', asyncJsonRoute(" + (asyncMod || '') + "(req, res) => {";
});

content = content.replace(/\}\);\n\nsecurityRouter/g, '}));\n\nsecurityRouter');
content = content.replace(/\}\);$/g, '}));');

fs.writeFileSync('src/lib/security/api/index.ts', content, 'utf8');
