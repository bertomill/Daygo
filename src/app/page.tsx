'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, BarChart2, ArrowRight, Book, LayoutDashboard, Pencil, Bookmark, ScrollText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignUp = () => {
    router.push("/register");
  };

  const handleGoToDashboard = () => {
    router.push("/home");
  };

  const handleNewJournal = () => {
    router.push("/journal/select-template");
  };

  const handleViewJournals = () => {
    router.push("/journal");
  };

  const handleViewTemplates = () => {
    router.push("/templates");
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // For authenticated users, show dashboard instead of landing page
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="fixed w-full top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="font-bold text-xl flex items-center">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-sm mr-1">Day</span>
                <span>Go</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleGoToDashboard}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={handleNewJournal}>
                New Entry
              </Button>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="pt-24 pb-20 container mx-auto px-4"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-5xl font-bold mb-4">Welcome Back to Daygo</h1>
              <p className="text-xl text-muted-foreground mb-6">Continue your journaling journey and track your progress.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Pencil className="mr-2 h-5 w-5 text-primary" />
                      Start Writing
                    </CardTitle>
                    <CardDescription>Create a new journal entry to capture your thoughts</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <Button className="w-full" onClick={handleNewJournal}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Journal Entry
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleViewJournals}>
                      <ScrollText className="mr-2 h-4 w-4" />
                      View Your Journal
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LayoutDashboard className="mr-2 h-5 w-5 text-primary" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Access frequently used features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="secondary" onClick={handleGoToDashboard} className="flex flex-col items-center justify-center h-24">
                        <BarChart2 className="h-6 w-6 mb-2" />
                        <span>Dashboard</span>
                      </Button>
                      <Button variant="secondary" onClick={handleViewTemplates} className="flex flex-col items-center justify-center h-24">
                        <Bookmark className="h-6 w-6 mb-2" />
                        <span>Templates</span>
                      </Button>
                      <Button variant="secondary" onClick={() => router.push('/community')} className="flex flex-col items-center justify-center h-24">
                        <Book className="h-6 w-6 mb-2" />
                        <span>Community</span>
                      </Button>
                      <Button variant="secondary" onClick={() => router.push('/account')} className="flex flex-col items-center justify-center h-24">
                        <CalendarDays className="h-6 w-6 mb-2" />
                        <span>Settings</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center"
            >
              <Button size="lg" className="px-8 py-6 text-lg" onClick={handleGoToDashboard}>
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="fixed w-full top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl flex items-center">
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded-sm mr-1">Day</span>
              <span>Go</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogin}>
              Log in
            </Button>
            <Button variant="default" onClick={handleSignUp}>
              Sign up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center px-4 py-2 mb-8 rounded-full border border-border gap-2 bg-secondary/50">
          <span className="bg-primary h-2 w-2 rounded-full"></span>
          <span className="text-sm font-medium">Journaling reimagined</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-3xl">
          Design your days with <span className="text-primary">intention</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
          DayGo helps you create structured journal templates and daily rituals
          that lead to deeper self-awareness and enhanced productivity.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" className="px-8 py-6 text-lg" onClick={handleSignUp}>
            Start your journaling journey
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-6 text-lg" onClick={handleLogin}>
            Log in
          </Button>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-muted py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Book className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Custom templates</CardTitle>
                <CardDescription>
                  Create personalized journal templates that fit your unique needs and goals
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart2 className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Track your progress</CardTitle>
                <CardDescription>
                  Monitor your growth and celebrate small wins with built-in tracking tools
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CalendarDays className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Daily rituals</CardTitle>
                <CardDescription>
                  Build consistent habits and routines that transform your productivity
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Start your journaling journey today</h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Join thousands of users who have transformed their lives through intentional journaling with Daygo.
        </p>
        <Button size="lg" className="px-8 py-6 text-lg" onClick={handleSignUp}>
          Sign up for free
        </Button>
      </div>
      
      {/* Footer */}
      <footer className="bg-muted py-12 text-center text-muted-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary text-primary-foreground px-2 py-1 text-xl font-bold">Day</div>
            <div className="text-xl font-bold">Go</div>
          </div>
          <p>&copy; {new Date().getFullYear()} Daygo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
