import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { explainDataError } from "@/lib/dataErrors";

// Shows a clear message at the top of the app when a page could not load its data,
// instead of leaving a spinner turning forever.
export default function ConnectionBanner() {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState(null);

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const check = () => {
      const failed = cache.getAll().find((q) => q.state.status === "error" && q.getObserversCount() > 0);
      setProblem(failed ? explainDataError(failed.state.error) : null);
    };
    check();
    return cache.subscribe(check);
  }, [queryClient]);

  if (!problem) return null;

  return (
    <div role="alert" className="relative z-30 bg-red-50 border-b border-red-200 px-4 py-3 text-red-900">
      <div className="max-w-3xl mx-auto flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">{problem.title}</p>
          <p className="mt-0.5">{problem.help}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-red-300 bg-white text-red-800 hover:bg-red-100"
          onClick={() => queryClient.refetchQueries({ predicate: (q) => q.state.status === "error" })}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
