"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Ship,
  Scale,
  FileBarChart,
  LogOut,
  ChevronUp,
  Gauge,
  Fuel,
  Receipt,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * `false` renders the row as a non-navigable "Coming soon" tooltip instead of
   * a link. Every entry currently ships as a real route, so this is the
   * extension point for a screen whose route exists but is not ready to enter.
   */
  active?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Adding a destination is one entry here and nothing else — the active state is
 * derived from `href`, so no per-item branch has to be written.
 *
 * `href` is matched exactly, or as a path prefix on a `/` boundary, which is
 * what keeps `/voyages` from lighting up on `/voyage/voyage_001`.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Navigation",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
      { label: "Voyages", href: "/voyages", icon: Ship, active: true },
      { label: "Reconciliations", href: "/reconciliations", icon: Scale, active: true },
      { label: "Reports", href: "/reports", icon: FileBarChart, active: true },
    ],
  },
  {
    label: "Modules",
    items: [
      { label: "Speed & consumption", href: "/modules/speed", icon: Gauge, active: true },
      { label: "Bunkers", href: "/modules/bunkers", icon: Fuel, active: true },
      { label: "Disbursements", href: "/modules/disbursements", icon: Receipt, active: true },
    ],
  },
];

function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.5rem 0",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "#ffffff",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.png"
              alt="Keel Logo"
              style={{
                width: 26,
                height: 26,
                objectFit: "contain",
              }}
            />
          </div>
          <div>
            <p
              className="font-display"
              style={{ fontSize: "1.0625rem", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em" }}
            >
              Keel
            </p>
            <p style={{ fontSize: "0.625rem", color: "var(--sidebar-foreground)", opacity: 0.6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Maritime Intelligence
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = isActiveRoute(pathname, item.href);

                if (item.active === false) {
                  return (
                    <SidebarMenuItem key={item.label}>
                      <Tooltip>
                        <TooltipTrigger render={<SidebarMenuButton style={{ opacity: 0.4, cursor: "default" }} />}>
                          <item.icon size={18} />
                          <span>{item.label}</span>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Coming Soon
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive}>
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      width: "100%",
                    }}
                  />
                }
              >
                  <Avatar style={{ width: 28, height: 28 }}>
                    <AvatarFallback
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        background: "oklch(0.65 0.18 250 / 0.2)",
                        color: "oklch(0.75 0.15 250)",
                      }}
                    >
                      OA
                    </AvatarFallback>
                  </Avatar>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 500, lineHeight: 1.2 }}>
                      Operations Analyst
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--sidebar-foreground)", opacity: 0.6 }}>
                      analyst@keel.io
                    </p>
                  </div>
                  <ChevronUp size={14} style={{ opacity: 0.5 }} />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" style={{ minWidth: 200 }}>
                <DropdownMenuItem disabled>
                  <span style={{ fontSize: "0.8125rem" }}>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <span style={{ fontSize: "0.8125rem" }}>Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/login" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} />}>
                  <LogOut size={14} />
                  <span style={{ fontSize: "0.8125rem" }}>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
