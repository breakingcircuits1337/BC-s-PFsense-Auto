
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShieldAlert, MessageCircle, BrainCircuit, Settings } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/threat-analysis', label: 'Threat Analysis', icon: ShieldAlert },
  { href: '/chat', label: 'LLM Chat', icon: MessageCircle },
  { href: '/explain-ai', label: 'Explain AI', icon: BrainCircuit },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="p-2">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={{ children: item.label, side: "right", align: "center" }}
              className={cn(
                "justify-start",
                pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <a>
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
