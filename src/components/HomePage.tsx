"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "./AppSidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getJournalEntries } from "@/lib/journalService"
import { CalendarDays, FileText, PlusCircle, Clock, Sparkles, BarChart2, Bookmark, Pencil } from "lucide-react"
import { format } from "date-fns"
import { JournalEntryForm } from "./JournalEntryForm"

export function HomePage() {
  const [journalStats, setJournalStats] = useState({
    totalEntries: 0,
    thisWeek: 0,
    thisMonth: 0,
    latestEntry: null as Date | null,
    streakDays: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const entries = await getJournalEntries()
        
        if (!entries || entries.length === 0) {
          setIsLoading(false)
          return
        }

        // Get current date information
        const now = new Date()
        const oneWeekAgo = new Date(now)
        oneWeekAgo.setDate(now.getDate() - 7)
        
        const oneMonthAgo = new Date(now)
        oneMonthAgo.setMonth(now.getMonth() - 1)
        
        // Calculate stats
        const entriesThisWeek = entries.filter(entry => 
          entry.createdAt && entry.createdAt.toDate() >= oneWeekAgo
        )
        
        const entriesThisMonth = entries.filter(entry => 
          entry.createdAt && entry.createdAt.toDate() >= oneMonthAgo
        )
        
        // Calculate streak (simplified - actual implementation would be more complex)
        // This is a placeholder implementation
        let streakDays = 0
        const entryDates = entries
          .filter(entry => entry.createdAt)
          .map(entry => entry.createdAt?.toDate().toDateString())
          .filter((date, index, self) => self.indexOf(date) === index) // Unique dates only
        
        // Sort dates in descending order
        entryDates.sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())
        
        // Check if last entry was today or yesterday
        const today = new Date().toDateString()
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        const yesterdayString = yesterday.toDateString()
        
        // If last entry was today or yesterday, count streak
        if (entryDates[0] === today || entryDates[0] === yesterdayString) {
          streakDays = 1
          
          // Count consecutive days
          for (let i = 1; i < entryDates.length; i++) {
            const currentDate = new Date(entryDates[i-1]!)
            currentDate.setDate(currentDate.getDate() - 1)
            
            if (currentDate.toDateString() === entryDates[i]) {
              streakDays++
            } else {
              break
            }
          }
        }
        
        // Get latest entry date
        const latestEntry = entries[0].createdAt?.toDate() || null
        
        setJournalStats({
          totalEntries: entries.length,
          thisWeek: entriesThisWeek.length,
          thisMonth: entriesThisMonth.length,
          latestEntry,
          streakDays
        })
        
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching journal stats:", error)
        setIsLoading(false)
      }
    }
    
    fetchStats()
  }, [])

  const handleNewEntry = () => {
    router.push("/journal/select-template")
  }

  const handleViewAllEntries = () => {
    router.push("/journal")
  }

  const handleCreateTemplate = () => {
    router.push("/templates/new")
  }

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
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
          <div className="flex flex-col gap-4">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Daygo</h1>
              <p className="mt-2 text-muted-foreground">
                Your personal space for daily reflections, goals, and growth.
              </p>
            </div>
          </div>
          
          {/* Quick Actions Section */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer" onClick={handleNewEntry}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  New Journal Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Record today's thoughts, feelings, and experiences.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={handleViewAllEntries}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="mr-2 h-5 w-5" />
                  View All Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse through your previous journal entries.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={handleCreateTemplate}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Bookmark className="mr-2 h-5 w-5" />
                  Create Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Design a new journal template for consistent entries.
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Stats Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Journal Stats</h2>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="mr-2 h-5 w-5" />
                    Total Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold">{journalStats.totalEntries}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <CalendarDays className="mr-2 h-5 w-5" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold">{journalStats.thisWeek}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold">{journalStats.streakDays} {journalStats.streakDays === 1 ? 'day' : 'days'}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="mr-2 h-5 w-5" />
                    Last Entry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  ) : journalStats.latestEntry ? (
                    <p className="text-lg font-medium">{format(journalStats.latestEntry, 'MMM d, yyyy')}</p>
                  ) : (
                    <p className="text-muted-foreground">No entries yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Quick Entry Form */}
          {journalStats.totalEntries === 0 && !isLoading && (
            <div className="mt-4">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Create Your First Journal Entry</CardTitle>
                  <CardDescription>
                    Start your journaling journey by writing your first entry below.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JournalEntryForm />
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </>
  )
} 