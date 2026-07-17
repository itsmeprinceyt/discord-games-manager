"use client";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

const FUNNY_MESSAGES = [
  "Pretending to work really hard...",
  "Definitely not just waiting for the API...",
  "If this takes too long, blame the internet.",
  "Reading logs so you don't have to.",
  "We're checking everything. Literally everything.",
  "Making the loading spinner earn its paycheck.",
  "Convincing the database to cooperate...",
  "The logs know what happened. We're asking nicely.",
  "Finding the one event you're looking for.",
  "Turning coffee into audit reports...",
  "Still loading... thanks for your patience.",
  "This message exists to make waiting less boring.",
  "You're still here? Nice.",
  "Loading... because instant would be suspicious.",
  "We could fake progress, but honesty is important.",
  "Please admire this spinning icon.",
  "The spinner is doing its best.",
  "Loading... no, seriously, we're loading.",
  "Almost there. Probably.",
  "Thanks for waiting!",
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
