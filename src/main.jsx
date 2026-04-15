import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import 'antd/dist/reset.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#dc2626',
            colorLink: '#b91c1c',
            colorText: '#1a1a1e',
            colorTextSecondary: '#6e6e73',
            colorBorder: '#e5e5ea',
            colorBgBase: '#f8f9fa',
            colorBgContainer: '#ffffff',
            borderRadius: 14,
            borderRadiusLG: 20,
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          },
          components: {
            Layout: {
              bodyBg: '#f8f9fa',
              siderBg: '#ffffff',
              headerBg: '#ffffff',
            },
            Menu: {
              itemBorderRadius: 12,
              itemSelectedBg: 'rgba(220, 38, 38, 0.08)',
              itemSelectedColor: '#b91c1c',
              itemHoverColor: '#1a1a1e',
              itemColor: '#6e6e73',
            },
            Card: {
              borderRadiusLG: 20,
            },
            Input: {
              activeBorderColor: '#dc2626',
              hoverBorderColor: '#ef4444',
            },
            Button: {
              borderRadius: 12,
              controlHeight: 40,
            },
          },
        }}
      >
        <AntdApp>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
