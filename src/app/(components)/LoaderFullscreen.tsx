import { Loader } from "lucide-react";
import PageWrapper from "./PageWrapper";

export default function LoaderFullscreen() {
  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6 flex items-center justify-center">
        <Loader />
      </div>
    </PageWrapper>
  );
}
