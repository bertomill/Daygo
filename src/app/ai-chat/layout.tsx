'use client';

import { SidebarProvider } from "@/components/ui/sidebar";

export default function AiChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full overflow-hidden">
        {children}
      </div>
    </SidebarProvider>
  );
} 