"use client";

import { ThreadManager } from "@/components/thread-manager";
import { ThreadMapManager} from "@/components/thread-map-manager";
import { ChatInterface } from "@/components/chat-interface";

import { useState } from "react";

export default function Home() {
  const [threadId, setThreadId] = useState<string>("default-thread");

  return (
    <main>
      <ChatInterface
        threadId = {threadId}
      />
    </main>
  );
}