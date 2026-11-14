import { createFileRoute, redirect } from "@tanstack/react-router";

import { authService } from "@/features/auth/auth-service";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ASTRA CARE — Astronaut Health Monitoring" },
      { name: "description", content: "Sign in with your astronaut access code to see your personal health and mission data." },
      { property: "og:title", content: "ASTRA CARE — Astronaut Health Monitoring" },
      { property: "og:description", content: "Personal astronaut health and space-environment monitoring prototype." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: authService.getSession() ? "/overview" : "/login", replace: true });
  },
});
