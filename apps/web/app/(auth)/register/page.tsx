"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Loader2, Ship } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

// TODO(security): Replace with real OAuth 2.0 / JWT register flow before production.
// This is a visual mock only — no credentials are stored, transmitted, or validated.

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Pre-populate email if passed from homepage CTA query param
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock registration — simulate latency then redirect to onboarding/dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
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
          maxWidth: 460,
          padding: "1.5rem 1.5rem",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.875rem",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
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
                  width: 32,
                  height: 32,
                  objectFit: "contain",
                }}
              />
            </div>
            <h1
              className="font-display"
              style={{
                fontSize: "2rem",
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
            Request Enterprise Alpha Access
          </p>
        </div>

        {/* Register card */}
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
              Create your enterprise account
            </h2>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              style={{ display: "grid", gap: "1rem" }}
            >
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <Label htmlFor="name-input">Full Name</Label>
                <Input
                  id="name-input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <Label htmlFor="email-input">Corporate Email</Label>
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
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <Label htmlFor="company-input">Company / Organization</Label>
                <Input
                  id="company-input"
                  type="text"
                  placeholder="Ariadne Chartering Ltd"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
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
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                style={{ width: "100%", cursor: loading ? "not-allowed" : "pointer", marginTop: "0.5rem" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Creating account…
                  </>
                ) : (
                  <>
                    Request Trial Access
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

            {/* Link back to login */}
            <div
              style={{
                textAlign: "center",
                marginTop: "1.25rem",
                fontSize: "0.825rem",
              }}
            >
              <span style={{ color: "var(--muted-foreground)" }}>Already have an account? </span>
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "#00a2ff" }}>
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p
          className="animate-fade-in"
          style={{
            fontSize: "0.75rem",
            color: "var(--muted-foreground)",
            textAlign: "center",
            marginTop: "1.5rem",
            animationDelay: "0.2s",
          }}
        >
          Secured with institutional standards · Piraeus &amp; London HQ
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <RegisterPageContent />
    </Suspense>
  );
}
