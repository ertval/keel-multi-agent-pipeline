import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "auto" }}>
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--header-bg)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          <SidebarTrigger />
          <Separator orientation="vertical" style={{ height: 20 }} />
          <span
            style={{
              fontSize: "0.8125rem",
              color: "var(--muted-foreground)",
              fontWeight: 500,
            }}
          >
            Maritime Intelligence Platform
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <ThemeToggle />
          </div>
        </header>
        {/* Page content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
