import {
  AppstoreOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  MessageOutlined,
  SettingOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Divider, Layout, Menu, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import SessionList from '@/components/chat/SessionList';

const mainLinks = [
  { to: '/chat', icon: <MessageOutlined />, label: '对话', matchPrefix: true },
  { to: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { to: '/jobs', icon: <ClockCircleOutlined />, label: '定时任务' },
];

const systemLinks = [
  { to: '/memory', icon: <StarOutlined />, label: '记忆' },
  { to: '/skills', icon: <AppstoreOutlined />, label: '技能' },
  { to: '/settings', icon: <SettingOutlined />, label: '设置' },
];

function NavSection({ label, links, pathname, onSelect }) {
  const selectedKeys = links
    .filter(({ to, matchPrefix }) => (matchPrefix ? pathname.startsWith(to) : pathname === to))
    .map(({ to }) => to);

  return (
    <div>
      <Typography.Text
        type="secondary"
        className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em]"
      >
        {label}
      </Typography.Text>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        onClick={({ key }) => onSelect(key)}
        items={links.map(({ to, icon, label: navLabel }) => ({
          key: to,
          icon,
          label: navLabel,
        }))}
        className="mt-2 border-0 bg-transparent"
      />
    </div>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isChat = pathname === '/chat' || pathname.startsWith('/chat/');

  return (
    <Layout.Sider
      width={isChat ? 304 : 272}
      theme="light"
      className="overflow-hidden border-r border-warm-border/40 shadow-[2px_0_12px_rgba(15,23,42,0.04)]"
    >
      <div className="flex h-full flex-col bg-white">
        <div className="flex h-14 items-center px-5 shrink-0">
          <Space size={12}>
            <img src="/hermes.svg" alt="Hermes" className="h-7 w-7" />
            <Typography.Text strong className="text-[15px] tracking-wide">
              Hermes
            </Typography.Text>
          </Space>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            <NavSection
              label="核心功能"
              links={mainLinks}
              pathname={pathname}
              onSelect={navigate}
            />
            <NavSection
              label="系统管理"
              links={systemLinks}
              pathname={pathname}
              onSelect={navigate}
            />
          </div>

          {isChat && (
            <>
              <Divider className="my-4" />
              <SessionList />
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-warm-border/30 px-4 py-3 text-center">
          <Typography.Text type="secondary" className="text-[11px] tracking-wide">
            Hermes Agent
          </Typography.Text>
        </div>
      </div>
    </Layout.Sider>
  );
}
