"use client"

import { AppSidebar } from "./AppSidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { JournalEntryForm } from "./JournalEntryForm"

export function HomePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex sticky top-0 z-10 h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          <div className="flex flex-col gap-4">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Daygo</h1>
              <p className="mt-4 text-muted-foreground">
                Your personal space for daily reflections, goals, and growth.
              </p>
            </div>
          </div>
          
          <div className="grid gap-6 mt-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-4">New Journal Entry</h3>
              <JournalEntryForm />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
} 