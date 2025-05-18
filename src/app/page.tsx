'use client';

// Import necessary components and hooks
import { useState, useEffect } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, BarChart2, Book } from "lucide-react"; 
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { DayGoLogo } from '@/components/DayGoLogo';
import Image from "next/image";

// Main landing page component
// Designer: This is the main landing page that users see when not logged in
// It includes a hero section, features section, CTA section and footer
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication status on mount
  // Designer: This handles redirecting logged in users to their dashboard
  useEffect(() => {
    // Skip authentication check if already redirecting
    if (isRedirecting) return;

    const auth = getAuth();
    
    // Check if user is already authenticated when component mounts
    const currentUser = auth.currentUser;
    if (currentUser) {
      setIsAuthenticated(true);
      setIsLoading(false);
      
      // Use direct window.location for reliable redirects
      console.log("User already authenticated, redirecting via window.location");
      window.location.href = '/home';
      return;
    }
    
    // Otherwise, set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isUserAuthenticated = !!user;
      setIsAuthenticated(isUserAuthenticated);
      setIsLoading(false);
      
      // Redirect authenticated users to home dashboard
      if (isUserAuthenticated && pathname === '/') {
        console.log('User authenticated, redirecting to /home');
        setIsRedirecting(true);
        router.replace('/home');
      }
    });
    
    return () => unsubscribe();
  }, [router, pathname, isRedirecting]);

  // Navigation handlers
  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignUp = () => {
    router.push("/register");
  };

  // Handle loading state
  // Designer: Show a simple loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // For authenticated users, we redirect in the useEffect hook
  // Designer: This is a fallback loading state while redirect happens
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Redirecting to your dashboard...</div>
      </div>
    );
  }

  // Main landing page for non-authenticated users
  // Designer: The main landing page layout starts here
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      {/* Designer: Fixed navigation bar with blur effect and border bottom */}
      <header className="fixed w-full top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <DayGoLogo size={36} variant="system" />
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
      {/* Designer: Main hero section with large text, description and CTA buttons */}
      <div className="container mx-auto px-4 pt-32 pb-24 flex flex-col items-center text-center relative overflow-hidden">
        {/* Background bookshelf image - full width, showing top shelves */}
        <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0">
          <Image 
            src="/daygo_bookshelf.png" 
            alt="Journal bookshelf" 
            fill
            priority
            sizes="100vw"
            className="opacity-50 dark:opacity-40 object-cover object-top"
            style={{ width: '100vw', maxWidth: '100vw' }}
          />
        </div>
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/60 to-background/80 pointer-events-none z-[1]"></div>
        
        <div className="inline-flex items-center justify-center px-4 py-2 mb-8 rounded-full border border-border gap-2 bg-secondary/70 backdrop-blur-sm relative z-10">
          <span className="bg-primary h-2 w-2 rounded-full"></span>
          <span className="text-sm font-medium">Journaling reimagined</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-3xl relative z-10 text-foreground">
          Design your days with <span className="text-primary">intention</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl relative z-10">
          DayGo helps you create structured journal templates and daily rituals
          that lead to deeper self-awareness and enhanced productivity.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center relative z-10">
          <Button size="lg" className="px-8 py-6 text-lg bg-primary/90 backdrop-blur-sm hover:bg-primary" onClick={handleSignUp}>
            Start your journaling journey
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-6 text-lg backdrop-blur-sm bg-background/50" onClick={handleLogin}>
            Log in
          </Button>
        </div>
      </div>
      
      {/* Features Section */}
      {/* Designer: Three column feature grid with icons and descriptions */}
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
      {/* Designer: Secondary call-to-action section with large heading and sign up button */}
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
      {/* Designer: Simple footer with logo and copyright */}
      <footer className="bg-muted py-12 text-center text-muted-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <DayGoLogo size={48} variant="system" />
          </div>
          <p>&copy; {new Date().getFullYear()} Daygo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
