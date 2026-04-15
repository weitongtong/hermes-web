import {
  EyeInvisibleOutlined,
  EyeOutlined,
  SaveOutlined,
  SettingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Collapse, Input, Skeleton, Space, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useConfig, useEnv } from '@/hooks/useHermesAPI';
import { api } from '@/lib/api';

function ConfigSection({ config }) {
  const [edits, setEdits] = useState({});
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const mutation = useMutation({
    mutationFn: (patch) => api.patchConfig(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      message.success('配置已保存');
    },
    onError: (error) => {
      message.error(error?.message || '保存失败');
    },
  });

  const modelDefault = edits['model.default'] ?? (typeof config.model === 'object' ? config.model.default : config.model) ?? '';
  const modelProvider = edits['model.provider'] ?? config.model?.provider ?? '';

  const handleSave = () => {
    const patch = {};
    if (edits['model.default'] !== undefined || edits['model.provider'] !== undefined) {
      patch.model = {
        ...(typeof config.model === 'object' ? config.model : {}),
        ...(edits['model.default'] !== undefined && { default: edits['model.default'] }),
        ...(edits['model.provider'] !== undefined && { provider: edits['model.provider'] }),
      };
    }

    if (Object.keys(patch).length > 0) {
      mutation.mutate(patch, {
        onSuccess: () => setEdits({}),
      });
    }
  };

  return (
    <Card bordered={false} className="shadow-warm" title="config.yaml">
      <Space direction="vertical" size={18} className="w-full">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Typography.Text type="secondary" className="mb-2 block text-[12px]">
              模型
            </Typography.Text>
            <Input
              value={modelDefault}
              onChange={(e) => setEdits((prev) => ({ ...prev, 'model.default': e.target.value }))}
              placeholder="默认模型 ID"
            />
          </div>
          <div>
            <Typography.Text type="secondary" className="mb-2 block text-[12px]">
              提供方
            </Typography.Text>
            <Input
              value={modelProvider}
              onChange={(e) => setEdits((prev) => ({ ...prev, 'model.provider': e.target.value }))}
              placeholder="provider 名称"
            />
          </div>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={mutation.isPending}
            disabled={Object.keys(edits).length === 0}
          >
            保存
          </Button>
          <Typography.Text type="secondary">
            修改后需要重启 gateway 才能完全生效。
          </Typography.Text>
        </Space>

        <Collapse
          items={[
            {
              key: 'raw',
              label: '原始配置 (JSON)',
              children: (
                <pre className="max-h-72 overflow-auto rounded-2xl border border-warm-border/60 bg-surface-overlay/60 p-4 text-xs text-warm-secondary">
                  {JSON.stringify(config, null, 2)}
                </pre>
              ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}

function EnvSection() {
  const { data: envVars, isLoading } = useEnv();
  const [showKeys, setShowKeys] = useState({});

  const rows = useMemo(
    () =>
      Object.entries(envVars || {}).map(([key, value]) => ({
        key,
        name: key,
        value,
        masked: value === '****',
      })),
    [envVars],
  );

  if (isLoading) {
    return (
      <Card bordered={false} className="shadow-warm" title="环境变量 (.env)">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Card bordered={false} className="shadow-warm" title="环境变量 (.env)">
      <Table
        size="small"
        rowKey="key"
        pagination={false}
        dataSource={rows}
        locale={{ emptyText: '未找到环境变量' }}
        columns={[
          {
            title: '键名',
            dataIndex: 'name',
            width: 260,
            render: (name) => <Typography.Text code>{name}</Typography.Text>,
          },
          {
            title: '值',
            dataIndex: 'value',
            render: (value, record) => (
              <Typography.Text type="secondary" className="font-mono">
                {record.masked && !showKeys[record.key] ? '••••••••' : value}
              </Typography.Text>
            ),
          },
          {
            title: '',
            width: 72,
            align: 'right',
            render: (_value, record) =>
              record.masked ? (
                <Button
                  type="text"
                  icon={showKeys[record.key] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowKeys((prev) => ({ ...prev, [record.key]: !prev[record.key] }))}
                />
              ) : null,
          },
        ]}
      />
    </Card>
  );
}

export default function Settings() {
  const { data: config, isLoading } = useConfig();

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="mx-auto max-w-5xl p-6">
        <Space direction="vertical" size={20} className="w-full">
          <div>
            <Space align="center" size={12}>
              <SettingOutlined className="text-[22px] text-hermes" />
              <Typography.Title level={2} className="!mb-0">
                设置
              </Typography.Title>
            </Space>
          </div>

          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="修改配置后需要重启 Hermes gateway"
            description={(
              <span>
                修改 <code>config.yaml</code> 和 <code>.env</code> 后，需要重启 gateway 才能生效。
              </span>
            )}
          />

          {isLoading ? (
            <Card bordered={false} className="shadow-warm">
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          ) : (
            <ConfigSection config={config || {}} />
          )}

          <EnvSection />
        </Space>
      </div>
    </div>
  );
}
