import { PauseOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Input, Space, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

const { TextArea } = Input;

export default function ChatInput({ onSend, isStreaming, onStop }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const prevStreamingRef = useRef(isStreaming);

  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      textareaRef.current?.focus();
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
  }, [isStreaming, onSend, value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0;

  return (
    <div className="border-t border-warm-border/30 bg-white px-4 pb-5 pt-3">
      <div className="mx-auto max-w-3xl">
        <Space.Compact className="w-full">
          <TextArea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoSize={{ minRows: 1, maxRows: 6 }}
            placeholder="给 Hermes 发消息..."
            className="rounded-r-none"
          />
          {isStreaming ? (
            <Button icon={<PauseOutlined />} onClick={onStop} className="h-auto rounded-l-none">
              停止
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              disabled={!canSend}
              className="h-auto rounded-l-none"
            >
              发送
            </Button>
          )}
        </Space.Compact>

        <Typography.Paragraph type="secondary" className="!mb-0 !mt-2 !text-center !text-[11px]">
          Enter 发送 · Shift + Enter 换行
        </Typography.Paragraph>
      </div>
    </div>
  );
}
