'use client';

import { SidebarProvider } from "@/components/ui/sidebar";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      {children}
    </SidebarProvider>
  );
} 