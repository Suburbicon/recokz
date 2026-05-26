"use client";

import { SparklesIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useChatAssistant } from "./use-chat-assistant";
import { ChatAssistantModal } from "./ChatAssistantModal";

export function ChatAssistantFab() {
  const chat = useChatAssistant();

  return (
    <>
      <Button
        type="button"
        size="icon"
        onClick={chat.openModal}
        aria-label="Открыть AI-ассистента"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl"
      >
        <SparklesIcon className="h-6 w-6" />
      </Button>
      <ChatAssistantModal
        open={chat.open}
        onOpenChange={(open) => (open ? chat.openModal() : chat.closeModal())}
        chat={chat}
      />
    </>
  );
}
