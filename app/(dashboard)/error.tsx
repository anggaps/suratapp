"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Terjadi Kesalahan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Kode error: <code className="rounded bg-muted px-1 py-0.5">{error.digest}</code>
            </p>
          )}
          <Button onClick={() => unstable_retry()} className="w-full">
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
