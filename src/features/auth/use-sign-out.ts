import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { authService } from "./auth-service";

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await authService.signOut();
    await navigate({ to: "/login", search: { signedOut: true }, replace: true });
  }, [queryClient, navigate]);
}
