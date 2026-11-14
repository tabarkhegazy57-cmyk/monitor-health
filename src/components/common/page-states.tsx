import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, LogIn, SearchX } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isNotFound, isUnauthorized } from "@/services/errors";

import { EmptyState } from "./empty-state";

export function PagePending() {
  return (
    <div className="animate-fade-up space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

export function PageError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryReset = useQueryErrorResetBoundary();
  useEffect(() => {
    queryReset.reset();
  }, [queryReset]);

  if (isUnauthorized(error)) {
    return (
      <EmptyState
        icon={LogIn}
        title="Your session has ended"
        description="For your privacy, data is only shown while you are signed in. Sign in again to continue."
        action={
          <Button asChild>
            <Link to="/login" search={{ redirect: undefined }}>Sign in again</Link>
          </Button>
        }
      />
    );
  }
  if (isNotFound(error)) {
    return (
      <EmptyState
        icon={SearchX}
        title="Not found"
        description="This item doesn't exist or isn't part of your profile."
        action={
          <Button asChild variant="outline">
            <Link to="/overview">Back to overview</Link>
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={AlertTriangle}
      tone="coral"
      title="This section didn't load"
      description={(error instanceof Error && error.message) || "Something went wrong while loading simulated data."}
      action={
        <Button
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Try again
        </Button>
      }
    />
  );
}
