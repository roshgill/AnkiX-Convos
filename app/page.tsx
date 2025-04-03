import { ThreadManager } from "@/components/thread-manager";
import { ThreadMapManager} from "@/components/thread-map-manager";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <ThreadMapManager />
    </main>
  );
}