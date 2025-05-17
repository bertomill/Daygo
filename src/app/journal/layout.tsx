'use client';

import { SidebarProvider } from "@/components/ui/sidebar";

export default function JournalLayout({
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