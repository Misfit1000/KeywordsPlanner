const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `import path from "path";
import { fileURLToPath } from "url";`,
  `import path from "path";`
);

code = code.replace(
  `const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);`,
  `const dirName = typeof __dirname !== 'undefined' ? __dirname : process.cwd();`
);

code = code.replace(
  `app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });`,
  `app.use(express.static(path.join(dirName, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(dirName, "dist", "index.html"));
    });`
);

fs.writeFileSync('server.ts', code);
