"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldX } from "lucide-react";

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [onLicensePage, setOnLicensePage] = useState(false);

  useEffect(() => {
    if (window.location.pathname === "/dashboard/licencia") {
      setOnLicensePage(true);
      setLoading(false);
      setAllowed(true);
      return;
    }

    const check = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/licencia/estado`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const data = await res.json();
        setAllowed(data.activa === true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed && !onLicensePage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <ShieldX className="mx-auto h-16 w-16 text-destructive/40" />
          <h2 className="text-2xl font-bold">Sistema Desactivado</h2>
          <p className="text-muted-foreground">
            Tu licencia ha expirado o no está activa. Comunicate con soporte para renovar.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}