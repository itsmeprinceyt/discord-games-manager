import PageWrapper from "../(components)/PageWrapper";

export default function UserDashboard() {
  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        <h1 className="text-2xl font-medium text-white mb-2">User Dashboard</h1>
      </div>
    </PageWrapper>
  );
}
