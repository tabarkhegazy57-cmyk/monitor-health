import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronDown, Eye, EyeOff, Info, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { Logo } from "@/components/brand/logo";
import { OrbitIllustration } from "@/components/brand/orbit-illustration";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_ERROR_MESSAGES, checkAccessCodeFormat, type AuthErrorCode } from "@/features/auth/access-code";
import { authService } from "@/features/auth/auth-service";
import { DEMO_ACCOUNTS } from "@/features/auth/demo-accounts";
import { cn } from "@/lib/utils";

interface LoginSearch {
  redirect?: string | undefined;
  signedOut?: boolean | undefined;
}

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect:
      typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//")
        ? s["redirect"]
        : undefined,
    signedOut: s["signedOut"] === true || s["signedOut"] === "true" ? true : undefined,
  }),
  beforeLoad: () => {
    if (authService.getSession()) throw redirect({ to: "/overview" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — ASTRA CARE" },
      { name: "description", content: "Enter your astronaut access code to open your personal ASTRA CARE dashboard." },
      { property: "og:title", content: "Sign in — ASTRA CARE" },
      { property: "og:description", content: "Astronaut access-code sign-in for the ASTRA CARE health monitoring prototype." },
    ],
  }),
  component: LoginPage,
});

type Status = "idle" | "loading" | "success";

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [demoOpen, setDemoOpen] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;
    const formatError = checkAccessCodeFormat(code);
    if (formatError) {
      setError(formatError);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setStatus("loading");
    const result = await authService.signIn(code);
    if (!result.ok) {
      setStatus("idle");
      setError(result.error);
      inputRef.current?.focus();
      return;
    }
    setStatus("success");
    setTimeout(() => {
      if (search.redirect) void navigate({ href: search.redirect, replace: true });
      else void navigate({ to: "/overview", replace: true });
    }, 650);
  };

  const applyDemoCode = (demo: string) => {
    setCode(demo);
    setError(null);
    setShow(true);
    inputRef.current?.focus();
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden border-r bg-brand-panel lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-starfield opacity-60" aria-hidden />
        <div className="relative z-10 p-10">
          <Logo />
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center px-10">
          <OrbitIllustration className="w-full max-w-[440px]" />
        </div>
        <div className="relative z-10 max-w-lg p-10 pt-0">
          <h2 className="text-3xl font-semibold leading-tight text-teal-deep">
            Personal health monitoring for every crew member.
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
            ASTRA CARE brings each astronaut's vital signs, wellbeing check-ins and the hazards of their mission into
            one private view.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">NASA Space Apps Challenge 2026 · Prototype</p>
        </div>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px] animate-fade-up">
          <Logo className="mb-10 lg:hidden" />
          <div className="mb-8">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">Astronaut access</div>
            <h1 className="text-[1.85rem] font-semibold leading-tight">Sign in to your health profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the access code issued to you. You'll only see your own readings, reports and alerts.
            </p>
          </div>

          {search.signedOut && status === "idle" && !error && (
            <div className="mb-5 flex items-center gap-2 rounded-md border bg-surface px-3 py-2.5 text-sm text-muted-foreground" role="status">
              <CheckCircle2 className="size-4 text-primary" /> You've signed out.
            </div>
          )}
          {search.redirect && !search.signedOut && status === "idle" && !error && (
            <div className="mb-5 flex items-center gap-2 rounded-md border bg-surface px-3 py-2.5 text-sm text-muted-foreground" role="status">
              <Info className="size-4 text-primary" /> Sign in to continue to that page.
            </div>
          )}

          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Access code</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  ref={inputRef}
                  id="access-code"
                  name="access-code"
                  type={show ? "text" : "password"}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="ASTRA-0000-XXX"
                  value={code}
                  disabled={status !== "idle"}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "code-error" : "code-hint"}
                  className={cn(
                    "h-12 pl-10 pr-12 font-mono text-[0.95rem] tracking-wider shadow-none",
                    error && "border-coral focus-visible:ring-coral",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={show ? "Hide access code" : "Show access code"}
                  aria-pressed={show}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {error ? (
                <p id="code-error" role="alert" className="text-sm text-coral-ink">
                  {AUTH_ERROR_MESSAGES[error]}
                </p>
              ) : (
                <p id="code-hint" className="text-xs text-muted-foreground">
                  Format: ASTRA-0000-XXX. Not case-sensitive.
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={status !== "idle"}>
              {status === "loading" && (
                <>
                  <Loader2 className="animate-spin" /> Verifying code…
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle2 /> Access granted
                </>
              )}
              {status === "idle" && (
                <>
                  Access dashboard <ArrowRight />
                </>
              )}
            </Button>
            {status === "success" && (
              <p role="status" className="text-center text-sm text-primary">
                Opening your personal dashboard…
              </p>
            )}
          </form>

          <Collapsible open={demoOpen} onOpenChange={setDemoOpen} className="mt-8 rounded-lg border bg-surface">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="rounded bg-coral-soft px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-coral-ink">
                  Demo
                </span>
                Demo access codes
              </span>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", demoOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1 border-t px-2 py-2">
                {DEMO_ACCOUNTS.map((d) => (
                  <li key={d.code} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-card">
                    <div className="min-w-0">
                      <div className="font-mono text-sm">{d.code}</div>
                      <div className="truncate text-xs text-muted-foreground">{d.label}</div>
                    </div>
                    <Button type="button" size="sm" variant="soft" onClick={() => applyDemoCode(d.code)} disabled={status !== "idle"}>
                      Use code
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                Fictional astronauts with simulated data, for demonstration only.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Prototype sign-in: sessions are stored in this browser tab only and are not production-grade security.
          </p>
        </div>
      </section>
    </div>
  );
}
