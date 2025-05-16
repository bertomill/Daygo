'use client';

// Import necessary dependencies
import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { resetPassword } from "@/lib/authUtils";
import { FirebaseError } from 'firebase/app';

// Main component for the forgot password page
export default function ForgotPasswordPage() {
  // State management for form data and UI states
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Handler for password reset form submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Attempt to send password reset email
      await resetPassword(email);
      setIsEmailSent(true);
      toast.success('Password reset email sent');
    } catch (error: unknown) {
      // Handle any errors during the reset process
      console.error('Password reset error:', error);
      const errorMessage = error instanceof FirebaseError 
        ? error.message 
        : 'Failed to send password reset email';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Main container with responsive padding and centering
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header section with title and description */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {/* Conditional rendering based on email sent status */}
        {isEmailSent ? (
          // Success message display after email is sent
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              {/* Success checkmark icon */}
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              {/* Success message content */}
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  We&apos;ve sent a password reset link to {email}
                </p>
                <p className="mt-2 text-sm text-green-700">
                  Check your email and follow the link to reset your password.
                </p>
                {/* Return to login button */}
                <div className="mt-4">
                  <Button variant="outline" className="mt-2" asChild>
                    <Link href="/login">Return to login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Password reset request form
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            {/* Email input field */}
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

            {/* Submit button with loading state */}
            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending reset link..." : "Send password reset link"}
              </Button>
            </div>

            {/* Back to login link */}
            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-primary hover:text-primary/90">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 