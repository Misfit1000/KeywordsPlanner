const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  `{ label: 'Total Projects', value: '4', icon: Folder, color: 'text-accent' },`,
  `{ label: 'Security Score', value: 'A-', icon: Activity, color: 'text-green-500' },\n          { label: 'Critical Security', value: '2', icon: AlertCircle, color: 'text-red-500' },`
);

code = code.replace(
  `{ label: 'Total Clusters', value: '142', icon: Layers, color: 'text-purple-500' },`,
  `{ label: 'Total Clusters', value: '142', icon: Layers, color: 'text-purple-500' },`
);

code = code.replace(
  `{ url: 'competitor.com', score: 82, issues: 4 },`,
  `{ url: 'competitor.com', score: 82, issues: 4 },\n            ].map((audit, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                <div>
                  <p className="font-medium truncate max-w-[200px]">{audit.url}</p>
                  <p className="text-xs text-muted-foreground">{audit.issues} issues found</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={\`text-sm font-bold \${audit.score > 80 ? 'text-green-500' : 'text-orange-500'}\`}>{audit.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-red-500" /> Recent Security Audits</h2>
          <div className="space-y-4">
            {[
              { url: 'example.com', score: 92, issues: 1, type: 'Secure' },
              { url: 'insecure.local', score: 45, issues: 12, type: 'Vulnerable' },`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
