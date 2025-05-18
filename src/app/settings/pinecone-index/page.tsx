'use client';

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2Icon, SearchIcon, CheckIcon, X, AlertTriangle } from "lucide-react";
import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Link from 'next/link';
import { useJournalSearch } from '@/hooks/useJournalSearch';
import { toast } from 'sonner';

export default function PineconeIndexPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    total?: number;
    indexed?: number;
    failed?: number;
    error?: string;
  } | null>(null);
  const router = useRouter();
  const { indexAllEntries } = useJournalSearch();
  
  // Make sure user is authenticated
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/login');
      }
    });
    
    return () => unsubscribe();
  }, [router]);
  
  const handleRebuildIndex = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Call the indexing endpoint
      const indexResult = await indexAllEntries();
      
      setResult(indexResult);
      
      if (indexResult.success) {
        toast.success('Journal index rebuilt successfully');
      } else {
        toast.error('Failed to rebuild journal index');
      }
    } catch (error) {
      console.error('Error rebuilding index:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Error rebuilding journal index');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="grid grid-cols-[auto_1fr] min-h-screen">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex sticky top-0 z-10 h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/settings">Settings</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Pinecone Index</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pinecone Index Management</h1>
              <p className="text-muted-foreground">
                Manage the vector index that powers AI journal search.
              </p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Rebuild Journal Index</CardTitle>
              <CardDescription>
                This will rebuild the vector index for all your journal entries. Use this if you notice that 
                the AI isn&apos;t finding journal entries correctly, or after importing a large number of entries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Rebuilding the index can take some time depending on how many journal entries you have.
                    The process will run in the background, but please don&apos;t close the browser until it completes.
                  </AlertDescription>
                </Alert>
                
                {result && (
                  <Alert variant={result.success ? "success" : "destructive"}>
                    {result.success ? <CheckIcon className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>
                      {result.success ? (
                        <div className="space-y-1">
                          <p>Successfully rebuilt journal index.</p>
                          <ul className="list-disc pl-4 text-sm">
                            <li>Total entries: {result.total}</li>
                            <li>Successfully indexed: {result.indexed}</li>
                            {result.failed > 0 && (
                              <li className="text-destructive-foreground">Failed to index: {result.failed}</li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        <p>{result.error || "An unknown error occurred."}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                onClick={handleRebuildIndex}
                disabled={loading}
                variant="default"
                size="default"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Rebuilding...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Rebuild Index
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
} 