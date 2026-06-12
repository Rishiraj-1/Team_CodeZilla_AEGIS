'use client';

import dynamic from 'next/dynamic';
import Shell from '@/components/shell/Shell';

const ChatPanel = dynamic(() => import('@/components/chat/ChatPanel'), { ssr: false });

export default function ChatPage() {
  return (
    <Shell>
      <ChatPanel />
    </Shell>
  );
}
