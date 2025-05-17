"use client"

import { AppSidebar } from "./AppSidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { getJournalEntries } from '@/services/journalService'
import { JournalEntry } from '@/types/journal'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Plus } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'

export function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true)
        const fetchedEntries = await getJournalEntries()
        setEntries(fetchedEntries)
      } catch (error) {
        toast.error('Failed to load journal entries')
        console.error('Error fetching journal entries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [])

  const formatDate = (timestamp: Timestamp | Date | undefined | null) => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      // Fallback for other cases
      return '';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex sticky top-0 z-10 h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Journal</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Journal Entries</h1>
            <Button asChild>
              <Link href="/journal/select-template">
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-pulse">Loading entries...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <h3 className="text-lg font-medium">No journal entries yet</h3>
              <p className="text-muted-foreground mt-1">Create your first entry to get started</p>
              <Button asChild className="mt-4">
                <Link href="/journal/select-template">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Entry
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="truncate">{entry.title}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 inline" />
                      {formatDate(entry.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {entry.content}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      onClick={() => router.push(`/journal/${entry.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Read More
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
    </>
  )
} 