"use client";
import { useParams } from "next/navigation";
import PageWrapper from "../../../(components)/PageWrapper";

export default function GameAccountManager() {
  const { account_id } = useParams();
  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="text-white">{account_id}</div>
    </PageWrapper>
  );
}
