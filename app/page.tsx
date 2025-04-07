import { ThreadManager } from "@/components/thread-manager";
import { ThreadMapManager} from "@/components/thread-map-manager";
import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <main className="w-full h-screen p-1">
      <ThreadMapManager />
    </main>
  );
}