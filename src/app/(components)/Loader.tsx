import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

const FUNNY_MESSAGES = [
  "Syncing game servers...",
  "Waking up the Discord bots...",
  "Checking player inventories...",
  "Loading guild data...",
  "Scanning game accounts...",
  "Rolling RNG...",
  "Fetching player stats...",
  "Spawning dashboard assets...",
  "Linking game sessions...",
  "Verifying bot permissions...",
  "Loading control panel...",
  "Preparing admin powers...",
  "Syncing shards...",
  "Compiling leaderboard data...",
  "Connecting to game realms...",
  "Initializing command handlers...",
  "Refreshing cache from the void...",
  "Calibrating matchmaking logic...",
  "Loading premium features...",
  "Almost ready to game.",
];

export default function Loader({ text }: { text?: string }) {
  const [randomMessage, setRandomMessage] = useState<string>("Loading...");

  useEffect(() => {
    const load = () => {
      const index = Math.floor(Math.random() * FUNNY_MESSAGES.length);
      setRandomMessage(FUNNY_MESSAGES[index]);
    };
    load();
  }, []);

  const message = text ?? randomMessage;

  return (
    <div className="text-center py-12 flex flex-col items-center justify-center">
      <Loader2Icon size={30} className="text-blue-600 animate-spin" />
      <p className="text-stone-400 mt-2 animate-pulse">{message}</p>
    </div>
  );
}
