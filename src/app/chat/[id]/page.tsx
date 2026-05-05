
'use client';

import React, { use } from 'react';
import { ConversationView } from '@/components/chat/ConversationView';

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <ConversationView conversationId={resolvedParams.id} />;
}
