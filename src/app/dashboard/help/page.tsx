"use client";
import ContactPageOnly from "../../(components)/ContactPage";
import PageWrapper from "../../(components)/PageWrapper";

export default function ContactPageDashboard() {
  return (
    <PageWrapper withSidebar sidebarRole="user">
      <ContactPageOnly />
    </PageWrapper>
  );
}
