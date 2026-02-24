import { motion } from 'motion/react';
import { LayoutDashboard, Search, BarChart3, Link, Settings, HelpCircle } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Search, label: 'Keyword Magic Tool' },
  { icon: BarChart3, label: 'Position Tracking' },
  { icon: Link, label: 'Backlink Analytics' },
];

export default function Sidebar() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-64 border-r border-white/5 bg-slate-950/50 backdrop-blur-xl hidden lg:flex flex-col h-[calc(100vh-73px)] sticky top-[73px]"
    >
      <div className="p-6 flex-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          SEO Toolkit
        </div>
        <nav className="space-y-1">
          {navItems.map((item, index) => (
            <a
              key={index}
              href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                item.active 
                  ? 'bg-blue-600/10 text-blue-400 font-medium' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.active ? 'text-blue-400' : 'text-slate-500'}`} />
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-white/5">
        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5 text-slate-500" />
            Settings
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <HelpCircle className="w-5 h-5 text-slate-500" />
            Help & Support
          </a>
        </nav>
      </div>
    </motion.aside>
  );
}
