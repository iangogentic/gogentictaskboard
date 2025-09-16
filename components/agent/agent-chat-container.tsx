"use client";

import { useState } from "react";
import { AgentChatButton } from "./agent-chat-button";
import { AgentChatPanel } from "./agent-chat-panel";

interface AgentChatContainerProps {
  projectId?: string;
}

export function AgentChatContainer({ projectId }: AgentChatContainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AgentChatButton onClick={() => setIsOpen(true)} />
      <AgentChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projectId={projectId}
      />
    </>
  );
}
