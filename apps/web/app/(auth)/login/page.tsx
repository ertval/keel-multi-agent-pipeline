"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Loader2, Ship } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// TODO(security): Replace with real OAuth 2.0 / JWT auth before production.
// This is a visual mock only — no credentials are stored, transmitted, or validated.
// The cookie below is a demo session flag (see proxy.ts): it records that the
// visitor walked through this page and nothing more.

const DEMO_COOKIE = "keel_demo_session=keel-demo-session; path=/; samesite=lax";

const subscribe = () => () => {};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const enter = () => {
    document.cookie = DEMO_COOKIE;
    // Same-origin paths only: `?next=` is attacker-supplied.
    const requested = new URLSearchParams(window.location.search).get("next");
    const target = requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";
    router.push(target);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock auth — no credential check, just simulated latency then redirect
    setTimeout(enter, 800);
  };

  const handleDemoLogin = () => {
    setEmail("demo@keel.io");
    setPassword("demo");
    setLoading(true);
    setTimeout(enter, 600);
  };

  if (!mounted) {
    return <div style={{ minHeight: "100vh" }} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Theme toggle in top-right */}
      <div
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 10,
        }}
      >
        <ThemeToggle />
      </div>

      {/* Background atmosphere */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 20% 80%, var(--login-bg-1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 20%, var(--login-bg-2) 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 50% 0%, var(--login-bg-3) 0%, transparent 70%)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Decorative grid lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(var(--login-grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--login-grid-line) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-slide-up"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
          padding: "0 1.5rem",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="Keel Logo"
                style={{
                  width: 36,
                  height: 36,
                  objectFit: "contain",
                }}
              />
            </div>
            <h1
              className="font-display"
              style={{
                fontSize: "2.25rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1,
              }}
            >
              Keel
            </h1>
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Ship size={14} />
            Maritime Intelligence Platform
          </p>
        </div>

        {/* Login card */}
        <Card
          style={{
            background: "var(--login-card-bg)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--login-card-border)",
          }}
        >
          <CardHeader style={{ paddingBottom: 0 }}>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Sign in to your account
            </h2>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              style={{ display: "grid", gap: "1.25rem" }}
            >
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <Label htmlFor="email-input">Email</Label>
                <Input
                  id="email-input"
                  type="email"
                  placeholder="analyst@shipping.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <Label htmlFor="password-input">Password</Label>
                <Input
                  id="password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <Button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                style={{ width: "100%", cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                margin: "1.25rem 0",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                or
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <Button
              id="demo-login-btn"
              variant="outline"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{ width: "100%" }}
              aria-label="Access Sample Workspace (Enter Demo Mode)"
            >
              <Ship size={14} />
              Access Sample Workspace
            </Button>

            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--muted-foreground)",
                textAlign: "center",
                marginTop: "1rem",
              }}
            >
              Evaluation access: demo@keel.io / any password
            </p>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--muted-foreground)",
                textAlign: "center",
                marginTop: "0.375rem",
              }}
            >
              Deployment preview — preloaded with audited voyage records and
              deterministic reconciliation models.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p
          className="animate-fade-in"
          style={{
            fontSize: "0.75rem",
            color: "var(--muted-foreground)",
            textAlign: "center",
            marginTop: "2rem",
            animationDelay: "0.3s",
          }}
        >
          Applies your charterparty&apos;s own weather clause, and measures excepted
          periods on the basis the Laytime Definitions supply &middot; advisory
          output, not a legal opinion
        </p>
      </div>
    </div>
  );
}
