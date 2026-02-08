import { Loader2Icon } from "lucide-react";

export default function Loader() {
  return (
    <div className="text-center py-12 flex flex-col items-center justify-center">
      <Loader2Icon size={30} className="text-blue-600 animate-spin" />
      <p className="text-stone-400 mt-2 animate-pulse">
        Loading, please wait...
      </p>
    </div>
  );
}
