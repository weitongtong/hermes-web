import { AppstoreOutlined, ArrowLeftOutlined, FileOutlined, TagsOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Empty, List, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { useSkill, useSkills } from '@/hooks/useHermesAPI';
import { api } from '@/lib/api';

function SkillCard({ skill, onClick }) {
  return (
    <Card
      hoverable
      bordered={false}
      onClick={onClick}
      className="h-full shadow-warm transition-transform hover:-translate-y-0.5"
    >
      <Space direction="vertical" size={12} className="w-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Typography.Title level={5} className="!mb-1">
              {skill.name}
            </Typography.Title>
            {skill.description ? (
              <Typography.Paragraph type="secondary" className="!mb-0 line-clamp-2">
                {skill.description}
              </Typography.Paragraph>
            ) : null}
          </div>
          {skill.version ? <Tag bordered={false}>v{skill.version}</Tag> : null}
        </div>

        {skill.tags?.length ? (
          <Space wrap size={[6, 6]}>
            {skill.tags.map((tag) => (
              <Tag key={tag} color="red">
                {tag}
              </Tag>
            ))}
          </Space>
        ) : null}
      </Space>
    </Card>
  );
}

function SkillDetail({ name, onBack }) {
  const { data: skill, isLoading } = useSkill(name);
  const { data: files } = useQuery({
    queryKey: ['skillFiles', name],
    queryFn: () => api.getSkillFiles(name),
    enabled: !!name,
  });

  if (isLoading) {
    return (
      <Card bordered={false} className="shadow-warm">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!skill) {
    return (
      <Card bordered={false} className="shadow-warm">
        <Empty description="未找到技能" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Button icon={<ArrowLeftOutlined />} type="text" onClick={onBack} className="w-fit !px-0">
        返回技能列表
      </Button>

      <Card bordered={false} className="shadow-warm">
        <Space direction="vertical" size={12} className="w-full">
          <div>
            <Space align="center" size={10}>
              <AppstoreOutlined className="text-[18px] text-hermes" />
              <Typography.Title level={4} className="!mb-0">
                {skill.name}
              </Typography.Title>
            </Space>
            {skill.description ? (
              <Typography.Paragraph type="secondary" className="!mb-0 !mt-2">
                {skill.description}
              </Typography.Paragraph>
            ) : null}
          </div>
          <MarkdownRenderer content={skill.content} />
        </Space>
      </Card>

      {files?.length ? (
        <Card
          bordered={false}
          className="shadow-warm"
          title={
            <Space size={8}>
              <FileOutlined />
              <span>关联文件</span>
            </Space>
          }
        >
          <List
            dataSource={files}
            renderItem={(file) => (
              <List.Item className="!px-0">
                <Typography.Text code>{file}</Typography.Text>
              </List.Item>
            )}
          />
        </Card>
      ) : null}
    </Space>
  );
}

export default function Skills() {
  const { data: skills, isLoading } = useSkills();
  const [selected, setSelected] = useState(null);

  const grouped = {};
  if (skills) {
    for (const skill of skills) {
      const category = skill.category || '未分类';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(skill);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="mx-auto max-w-6xl p-6">
        <Space direction="vertical" size={20} className="w-full">
          <div>
            <Space align="center" size={12}>
              <AppstoreOutlined className="text-[22px] text-hermes" />
              <Typography.Title level={2} className="!mb-0">
                技能
              </Typography.Title>
            </Space>
          </div>

          {selected ? (
            <SkillDetail name={selected} onBack={() => setSelected(null)} />
          ) : isLoading ? (
            <Row gutter={[16, 16]}>
              {[...Array(4)].map((_, index) => (
                <Col xs={24} sm={12} key={index}>
                  <Card bordered={false} className="shadow-warm">
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : !skills?.length ? (
            <Card bordered={false} className="shadow-warm">
              <Empty description="暂未安装任何技能" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          ) : (
            <Space direction="vertical" size={20} className="w-full">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <Space align="center" size={8} className="mb-3">
                    <TagsOutlined className="text-warm-muted" />
                    <Typography.Text type="secondary" className="text-[12px] font-semibold uppercase tracking-[0.18em]">
                      {category}
                    </Typography.Text>
                  </Space>

                  <Row gutter={[16, 16]}>
                    {items.map((skill) => (
                      <Col xs={24} md={12} key={skill.slug}>
                        <SkillCard skill={skill} onClick={() => setSelected(skill.slug)} />
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </Space>
          )}
        </Space>
      </div>
    </div>
  );
}
