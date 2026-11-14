import { useRouteContext } from "@tanstack/react-router";

import type { Session } from "@/types/domain";

/** The signed-in astronaut's session. Only usable inside the protected area. */
export function useSession(): Session {
  return useRouteContext({ from: "/_authenticated", select: (c) => c.session });
}
