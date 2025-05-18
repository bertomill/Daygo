'use client';

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Tablet } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getAuth } from "firebase/auth";

export function Navbar() {
  useEffect(() => {
    // Initialize auth for consistency with the rest of the app
    getAuth();
  }, []);

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/journal", label: "Journal" },
    { href: "/templates", label: "Templates" },
    { href: "/ai-chat", label: "Talk to Daygo AI" },
    { href: "/journal/new", label: "New Journal Entry" },
    { href: "/templates/new", label: "New Template" },
    { href: "/account", label: "Account" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background md:hidden">
      <div className="flex h-14 items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="mr-2"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link
              href="/"
              className="flex items-center gap-2 mb-8"
            >
              <Tablet className="h-6 w-6" />
              <span className="font-bold">Daygo</span>
            </Link>
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-foreground/80 transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            <span className="font-bold">Daygo</span>
          </Link>
        </div>
      </div>
    </header>
  );
} 