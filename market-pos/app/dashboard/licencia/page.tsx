"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  ShieldX,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LicenciaState {
  activa: boolean;
  plan: string | null;
  fecha_activacion: string | null;
  fecha_expiracion: string | null;
  dias_restantes: number | null;
}

const PLANS = {
  mensual: { color: "bg-blue-500/10 text-blue-400", label: "Plan Mensual", precio: "380 Bs/mes" },
  trimestral: { color: "bg-violet-500/10 text-violet-400", label: "Plan Trimestral", precio: "999 Bs/3 meses" },
  anual: { color: "bg-emerald-500/10 text-emerald-400", label: "Plan Anual", precio: "3.600 Bs/año" },
  vitalicio: { color: "bg-amber-500/10 text-amber-400", label: "Plan Vitalicio", precio: "8.500 Bs" },
};

function formatearFecha(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function LicenciaPage() {
  const [loading, setLoading] = useState(true);
  const [licencia, setLicencia] = useState<LicenciaState | null>(null);
  const [clave, setClave] = useState("");
  const [activando, setActivando] = useState(false);

  const fetchEstado = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/licencia/estado`);
      const data = await res.json();
      setLicencia(data);
    } catch {
      setLicencia({
        activa: false,
        plan: null,
        fecha_activacion: null,
        fecha_expiracion: null,
        dias_restantes: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstado();
  }, []);

  const handleActivar = async () => {
    if (!clave.trim()) {
      toast.error("Ingresá la clave de licencia");
      return;
    }

    setActivando(true);
    try {
      const res = await fetch(`${API_BASE}/licencia/activar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: clave.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || "Clave inválida");
        return;
      }

      toast.success("Licencia activada correctamente");
      setClave("");
      fetchEstado();
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setActivando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Estado principal */}
      <Card
        className={`border-2 ${
          licencia?.activa
            ? "border-emerald-500/30"
            : "border-destructive/30"
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            {licencia?.activa ? (
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            ) : (
              <ShieldX className="h-6 w-6 text-destructive" />
            )}
            {licencia?.activa
              ? "Sistema Activado"
              : "Sistema Desactivado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {licencia?.activa ? (
            <>
              <div className="flex items-center justify-between rounded-lg bg-background/40 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan actual</p>
                  <p className="text-lg font-bold">
                    {PLANS[licencia.plan]?.label || "—"}
                  </p>
                </div>
                <Badge
                  className={`${
                    PLANS[licencia.plan]?.color || ""
                  } border-0 text-sm px-4 py-1.5`}
                >
                  {PLANS[licencia.plan]?.precio || "—"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 rounded-lg bg-background/40 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Activación</p>
                  <p className="text-sm font-semibold">
                    {formatearFecha(licencia.fecha_activacion)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expiración</p>
                  <p className="text-sm font-semibold">
                    {formatearFecha(licencia.fecha_expiracion)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Días restantes</p>
                  <p
                    className={`text-lg font-bold ${
                      (licencia.dias_restantes ?? 0) <= 5
                        ? "text-destructive"
                        : "text-emerald-400"
                    }`}
                  >
                    {licencia.dias_restantes ?? "—"}
                  </p>
                </div>
              </div>

              {(licencia.dias_restantes ?? 0) <= 5 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                  <p className="text-sm font-semibold text-destructive">
                    ⚠️ Tu licencia vence en {licencia.dias_restantes} días.
                    Renová para evitar interrupciones.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
              <ShieldX className="mx-auto mb-3 h-12 w-12 text-destructive/50" />
              <p className="mb-1 text-lg font-semibold text-destructive">
                Sistema sin licencia activa
              </p>
              <p className="text-sm text-muted-foreground">
                El sistema está bloqueado. Ingresá tu clave de licencia para activarlo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activar licencia */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-primary" />
            Activar Licencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Clave de licencia</Label>
            <Input
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              value={clave}
              onChange={(e) => setClave(e.target.value.toUpperCase())}
              className="font-mono tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              Recibís esta clave por WhatsApp o email al contratar un plan.
            </p>
          </div>
          <Button
            onClick={handleActivar}
            disabled={activando || !clave.trim()}
            className="w-full gap-2"
          >
            {activando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {activando ? "Activando..." : "Activar Licencia"}
          </Button>
        </CardContent>
      </Card>

      {/* Info planes */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Planes Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PLANS).map(([key, info]) => (
              <div
                key={key}
                className={`rounded-lg border p-4 ${
                  licencia?.plan === key
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    className={`${info.color} border-0 text-xs`}
                  >
                    {info.label}
                  </Badge>
                  {licencia?.plan === key && (
                    <Badge className="border-0 bg-primary/10 text-xs text-primary">
                      ACTUAL
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-bold">{info.precio}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refrescar */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={fetchEstado} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Verificar estado de licencia
        </Button>
      </div>
    </div>
  );
}