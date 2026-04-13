import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PanelLeft } from 'lucide-react';
import SessionList from './SessionList';

const LS_KEY = 'hermes-chat-panel-collapsed';

function getCollapsed() {
  try {
    return localStorage.getItem(LS_KEY) === '1';
  } catch {
    return false;
  }
}

export default function SessionPanel({ onNewChat }) {
  const [collapsed, setCollapsed] = useState(getCollapsed);
  const navigate = useNavigate();

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(LS_KEY, next ? '1' : '0'); } catch {}
  };

  if (collapsed) {
    return (
      <div className="w-[52px] shrink-0 bg-surface/50 flex flex-col items-center py-3 gap-1.5 border-r border-warm-border/30">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-warm-muted hover:text-warm-text hover:bg-white transition-all duration-150"
          title="展开会话列表"
        >
          <PanelLeft size={16} />
        </button>
        <div className="w-5 h-px bg-warm-border/40 my-1" />
        <button
          onClick={() => navigate('/chat')}
          className="p-2 rounded-lg text-warm-muted hover:text-hermes hover:bg-hermes/6 transition-all duration-150"
          title="新建对话"
        >
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 bg-surface/50 flex flex-col border-r border-warm-border/30">
      <SessionList onNewChat={onNewChat} />
      <div className="px-3 py-2 border-t border-warm-border/20 shrink-0">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-warm-muted/60 hover:text-warm-muted rounded-md hover:bg-surface-overlay/60 transition-all duration-150"
        >
          <PanelLeft size={12} />
          收起
        </button>
      </div>
    </div>
  );
}
