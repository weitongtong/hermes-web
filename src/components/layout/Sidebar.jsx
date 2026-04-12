import { NavLink, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  LayoutDashboard,
  History,
  Timer,
  Brain,
  Sparkles,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const mainLinks = [
  { to: '/chat', icon: MessageSquare, label: '对话', matchPrefix: true },
  { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/sessions', icon: History, label: '会话历史' },
  { to: '/jobs', icon: Timer, label: '定时任务' },
];

const systemLinks = [
  { to: '/memory', icon: Brain, label: '记忆' },
  { to: '/skills', icon: Sparkles, label: '技能' },
  { to: '/settings', icon: Settings, label: '设置' },
];

function NavGroup({ label, links, pathname }) {
  return (
    <div>
      <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-warm-muted">
        {label}
      </p>
      <div className="space-y-0.5">
        {links.map(({ to, icon: Icon, label: navLabel, matchPrefix }) => {
          const active = matchPrefix ? pathname.startsWith(to) : pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={() =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200',
                  active
                    ? 'bg-hermes/8 text-hermes-dark font-medium'
                    : 'text-warm-secondary hover:text-warm-text hover:bg-hermes/4'
                )
              }
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.5} />
              <span>{navLabel}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-56 shrink-0 bg-white flex flex-col shadow-[2px_0_12px_rgba(0,0,0,0.04)]">
      <div className="h-14 flex items-center gap-3 px-5">
        <img src="/hermes.svg" alt="Hermes" className="w-7 h-7" />
        <span className="font-semibold text-warm-text tracking-wide text-[15px]">Hermes</span>
      </div>

      <nav className="flex-1 py-4 px-2.5 space-y-5 overflow-y-auto">
        <NavGroup label="核心功能" links={mainLinks} pathname={pathname} />
        <NavGroup label="系统管理" links={systemLinks} pathname={pathname} />
      </nav>

      <div className="p-3">
        <p className="text-[10px] text-warm-muted/60 text-center tracking-wide">Hermes Agent</p>
      </div>
    </aside>
  );
}
