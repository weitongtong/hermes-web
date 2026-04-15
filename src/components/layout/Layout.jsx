import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <AntLayout className="h-screen bg-surface text-warm-text">
      <Sidebar />
      <AntLayout className="bg-transparent">
        <AntLayout.Content className="overflow-hidden">
          <Outlet />
        </AntLayout.Content>
      </AntLayout>
    </AntLayout>
  );
}
