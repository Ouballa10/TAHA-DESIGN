"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ActionState } from "@/types/actions";

export function useActionToast(state: ActionState) {
  const router = useRouter();
  const lastEventRef = useRef<string>("");

  const signature = useMemo(
    () => JSON.stringify([state.success, state.message, state.error, state.redirectTo, state.fieldErrors]),
    [state],
  );

  useEffect(() => {
    if ((!state.message && !state.error) || lastEventRef.current === signature) {
      return;
    }

    lastEventRef.current = signature;

    if (state.success && state.message) {
      toast.success(state.message);
    }

    if (!state.success && state.error) {
      toast.error(state.error);
    }

    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
      return;
    }

    if (state.success) {
      router.refresh();
    }
  }, [router, signature, state]);
}
