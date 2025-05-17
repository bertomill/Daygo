'use client';

import { SidebarProvider } from "@/components/ui/sidebar";

export default function AccountLayout({
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