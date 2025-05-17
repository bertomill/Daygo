'use client';

import { useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { registerUser } from "@/lib/authUtils";
import { FirebaseError } from 'firebase/app';
import { motion } from "framer-motion";
import { Calendar, CheckCircle, Clock, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords don&apos;t match");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await registerUser(name, email, password);
      toast.success('Account created successfully');
      router.push('/');
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        // Handle Firebase errors
        switch (error.code) {
          case 'auth/email-already-in-use':
            setError('Email is already in use');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address');
            break;
          case 'auth/weak-password':
            setError('Password is too weak');
            break;
          default:
            setError('An error occurred during registration');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-black font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="font-bold text-xl flex items-center">
              <span className="bg-black text-white px-2 py-1 rounded-md mr-1">Day</span>
              <span>Go</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-600 hover:text-black transition-colors">
              Log in
            </Link>
            <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white rounded-full px-4">
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left side - App information */}
        <div className="w-full md:w-1/2 bg-gray-50 py-24 px-6 md:px-12 flex items-center justify-center">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center bg-gray-100 rounded-full px-4 py-1 mb-6 self-start">
                <Sparkles className="w-4 h-4 text-black mr-2" />
                <span className="text-sm font-medium">Journaling reimagined</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Design your days with
                <span className="relative ml-2">
                  intention
                  <motion.div
                    className="absolute -bottom-2 left-0 h-3 w-full bg-gray-200 -z-10"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </span>
              </h1>

              <p className="text-lg text-gray-700 mb-8">
                DayGo helps you create structured journal templates and daily rituals 
                that lead to deeper self-awareness and enhanced productivity.
              </p>

              <div className="space-y-6 mt-8">
                {[
                  {
                    icon: <Calendar className="h-5 w-5 text-black" />,
                    title: "Custom templates",
                    description: "Create personalized journal templates that fit your unique needs and goals"
                  },
                  {
                    icon: <CheckCircle className="h-5 w-5 text-black" />,
                    title: "Track your progress",
                    description: "Monitor your growth and celebrate small wins with built-in tracking tools"
                  },
                  {
                    icon: <Clock className="h-5 w-5 text-black" />,
                    title: "Daily rituals",
                    description: "Build consistent habits and routines that transform your productivity"
                  }
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + (i * 0.2) }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 mt-1 bg-gray-100 p-2 rounded-full">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-black">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4">Start your journaling journey today</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="w-full md:w-1/2 pt-24 pb-16 px-6 md:px-12 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-bold tracking-tight">Create your account</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium hover:text-primary">
                  Sign in
                </Link>
              </p>
            </div>
            
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              <div className="space-y-4 rounded-md shadow-sm">
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium">
                    Full name
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      className="block w-full"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="block text-sm font-medium">
                    Email address
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="block w-full"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium">
                    Confirm password
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="block w-full"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full h-12 rounded-md" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              By registering, you agree to our{" "}
              <Link href="/terms" className="font-medium text-primary hover:text-primary/90">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-primary hover:text-primary/90">
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 