"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <html lang="id">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
          <p className="text-muted-foreground">
            Aplikasi mengalami kesalahan yang tidak terduga. Silakan coba lagi.
          </p>
          {error.digest && (
            <p className="text-sm text-muted-foreground">
              Kode error: <code>{error.digest}</code>
            </p>
          )}
          <Button onClick={() => unstable_retry()}>Coba Lagi</Button>
        </div>
      </body>
    </html>
  );
}
