
"use client";
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { AppNavigation } from './navigation';
import { PanelLeft, CircuitBoard } from 'lucide-react'; // Using CircuitBoard as a generic icon

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <Link href="https://breakingcircuits.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
            {/* Text-based logo */}
            <CircuitBoard className="h-10 w-10 text-primary group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 transition-all shrink-0" />
            <h1 className="text-2xl font-bold text-foreground group-data-[collapsible=icon]:hidden whitespace-nowrap">
              BREAKING CIRCUITS
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <AppNavigation />
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BREAKING CIRCUITS</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <SidebarTrigger variant="ghost" size="icon" className="md:hidden">
            <PanelLeft className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </SidebarTrigger>
          <Link href="https://breakingcircuits.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 ml-2">
            {/* Mobile text-based logo */}
            <CircuitBoard className="h-7 w-7 text-primary shrink-0" />
            <h1 className="text-lg font-semibold text-foreground">BREAKING CIRCUITS</h1>
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
