
"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const logoUrl = "https://tse4.mm.bing.net/th/id/OIP.gCLYWkaRILGpYmiOCYe8kgAAAA?pid=Api&h=220&P=0";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-40 print:hidden shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 overflow-hidden rounded bg-white flex items-center justify-center border shadow-sm">
              <Image 
                src={logoUrl} 
                alt="JAYA Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <span className="font-bold text-primary tracking-tight">JAYA</span>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-none">
              <SheetHeader className="p-4 border-b sr-only">
                <SheetTitle>Menu Navigasi JAYA</SheetTitle>
                <SheetDescription>Akses cepat ke fitur-fitur JAYA melalui perangkat mobile.</SheetDescription>
              </SheetHeader>
              <div className="h-full flex flex-col">
                <div className="p-4 flex items-center justify-between border-b">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 overflow-hidden rounded bg-white flex items-center justify-center border shadow-sm">
                      <Image 
                        src={logoUrl} 
                        alt="JAYA Logo"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <span className="font-bold text-primary tracking-tight">JAYA</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar onItemClick={() => setOpen(false)} className="w-full border-none shadow-none" hideLogo />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
          <div className="animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
