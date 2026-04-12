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

const links = [
  { to: '/chat', icon: MessageSquare, label: '对话', matchPrefix: true },
  { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/sessions', icon: History, label: '会话历史' },
  { to: '/jobs', icon: Timer, label: '定时任务' },
  { to: '/memory', icon: Brain, label: '记忆' },
  { to: '/skills', icon: Sparkles, label: '技能' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200/70 bg-white flex flex-col">
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-200/70">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-hermes to-hermes-dark flex items-center justify-center shadow-sm shadow-hermes/20">
          <span className="text-white font-bold text-sm tracking-tight">H</span>
        </div>
        <span className="font-semibold text-gray-800 tracking-wide text-[15px]">Hermes</span>
      </div>

      <nav className="flex-1 py-3 px-2.5 space-y-0.5">
        {links.map(({ to, icon: Icon, label, matchPrefix }) => {
          const active = matchPrefix ? pathname.startsWith(to) : pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={() =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                  active
                    ? 'bg-surface-overlay text-hermes-dark font-medium shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-surface-overlay/50'
                )
              }
            >
              <Icon size={17} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200/70">
        <p className="text-[11px] text-gray-300 text-center">Hermes Agent</p>
      </div>
    </aside>
  );
}
