"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { apiLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Store, User, Lock, AlertCircle, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LicenciaInfo {
  activa: boolean;
  plan: string | null;
  plan_nombre: string | null;
  dias_restantes: number | null;
}

export default function LoginPage() {
  const router = useRouter();
  const store = useAuthStore();
  const didHydrate = useRef(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [licencia, setLicencia] = useState<LicenciaInfo | null>(null);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      store.hydrate();
    }
  }, [store]);

  useEffect(() => {
    if (!store.hydrated) return;
    if (store.token) {
      router.replace("/dashboard");
    }
  }, [store.hydrated, store.token, router]);

  useEffect(() => {
    const fetchLicencia = async () => {
      try {
        const res = await fetch(`${API_BASE}/licencia/estado`);
        const data = await res.json();
        setLicencia(data);
      } catch {
        setLicencia(null);
      }
    };
    fetchLicencia();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const data = await apiLogin(username.trim(), password);
      store.setAuth(data.access_token, username.trim(), "admin");
      toast.success("Bienvenido a Market POS");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="animate-float-orb pointer-events-none absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full bg-primary/15 blur-3xl" />
      <div className="animate-float-orb-reverse pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-accent/12 blur-3xl" />

      <div className="animate-card-enter relative z-10 w-full max-w-[420px] rounded-2xl border border-border/60 bg-card/65 p-10 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-2xl shadow-lg shadow-primary/30">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold text-transparent">
            Market POS
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sistema de Gestión de Ventas
          </p>
        </div>

        {licencia && (
          <div
            className={`mb-6 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${
              licencia.activa
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            <div className="flex items-center gap-2">
              {licencia.activa ? (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              {licencia.activa ? (
                <span className="font-medium text-emerald-400">
                  {licencia.plan_nombre} — Activo
                </span>
              ) : (
                <span className="font-medium text-destructive">
                  Sin licencia activa
                </span>
              )}
            </div>
            {licencia.activa && licencia.dias_restantes !== null && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{licencia.dias_restantes} días restantes</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-muted-foreground">
              Usuario
            </Label>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                disabled={loading}
                className="pr-10 bg-background/60 border-border/60 focus:border-primary/60 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="pr-10 bg-background/60 border-border/60 focus:border-primary/60 focus:ring-primary/15"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full bg-gradient-to-r from-primary to-accent text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          Market POS v2.0 — Sistema Inteligente de Gestión Comercial
        </p>
      </div>
    </div>
  );
}