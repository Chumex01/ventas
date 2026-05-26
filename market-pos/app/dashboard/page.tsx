"use client";

import { useEffect, useState } from "react";
import {
  Users,
  ShoppingCart,
  Banknote,
  TrendingUp,
  Search,
  FileDown,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  apiGetPersonal,
  apiGetCompras,
  apiGetVentas,
  apiGetKardexCompras,
  apiGetKardexVentas,
  apiGetProductos,
} from "@/lib/api";
import type { KardexRow, Producto } from "@/lib/types";
import { toast } from "sonner";

// ===== HELPERS =====
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBs(n: number) {
  return `Bs ${n.toFixed(2)}`;
}

// ===== COLORES PARA GRÁFICOS =====
const COLORS_CHART = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

// ===== CUSTOM TOOLTIP DARK =====
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/60 bg-secondary p-3 shadow-xl">
        <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
        {payload.map((pl: any, index: number) => (
          <p key={index} style={{ color: pl.color || pl.fill }} className="text-sm font-semibold">
            {pl.name}: {typeof pl.value === "number" && pl.name.includes("Bs") ? formatBs(pl.value) : pl.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ===== COMPONENTE PRINCIPAL =====
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [statPersonal, setStatPersonal] = useState(0);
  const [statCompras, setStatCompras] = useState(0);
  const [statVentas, setStatVentas] = useState(0);
  const [statIngresos, setStatIngresos] = useState(0);
  const [kardexCompras, setKardexCompras] = useState<KardexRow[]>([]);
  const [kardexVentas, setKardexVentas] = useState<KardexRow[]>([]);
  const [searchCompras, setSearchCompras] = useState("");
  const [searchVentas, setSearchVentas] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Datos para gráficos
  const [topProductos, setTopProductos] = useState<{ name: string; cantidad: number; total: number }[]>([]);
  const [ingresosVsEgresos, setIngresosVsEgresos] = useState<{ name: string; ventas: number; compras: number }[]>([]);
  const [stockBajo, setStockBajo] = useState<Producto[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      try {
        const [personal, compras, ventas, kCompras, kVentas, productos] = await Promise.all([
          apiGetPersonal().catch(() => []),
          apiGetCompras().catch(() => []),
          apiGetVentas().catch(() => []),
          apiGetKardexCompras().catch(() => []),
          apiGetKardexVentas().catch(() => []),
          apiGetProductos().catch(() => []),
        ]);

        if (cancelled) return;

        const pList = personal as any[];
        const cList = compras as any[];
        const vList = ventas as any[];
        const prList = productos as Producto[];

        setStatPersonal(pList.length || 0);
        setStatCompras(cList.length || 0);
        setStatVentas(vList.length || 0);

        const totalIngresos = vList.reduce((s: number, v: any) => s + (v.total || 0), 0);
        setStatIngresos(totalIngresos);

        // --- PROCESAR TOP 5 PRODUCTOS ---
        const productSalesMap: Record<string, { name: string; cantidad: number; total: number }> = {};
        vList.forEach((v: any) => {
          (v.detalle_ventas || []).forEach((d: any) => {
            const name = d.producto_nombre || (d.producto && d.producto.nombre) || "Desconocido";
            if (!productSalesMap[name]) {
              productSalesMap[name] = { name, cantidad: 0, total: 0 };
            }
            productSalesMap[name].cantidad += d.cantidad || 0;
            productSalesMap[name].total += (d.cantidad * d.precio_unitario) || 0;
          });
        });
        const top5 = Object.values(productSalesMap).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
        setTopProductos(top5);

        // --- PROCESAR INGRESOS VS EGRESOS (POR DÍA O TOTALES) ---
        const totalCompras = cList.reduce((s: number, c: any) => {
          return s + (c.detalle_compras || []).reduce((sub: number, d: any) => sub + (d.cantidad * d.precio_unitario), 0);
        }, 0);
        setIngresosVsEgresos([{ name: "Totales", ventas: totalIngresos, compras: totalCompras }]);

        // --- STOCK BAJO ---
        const lowStock = prList.filter(p => p.stock <= 3 && p.estado).sort((a, b) => a.stock - b.stock).slice(0, 5);
        setStockBajo(lowStock);

        setKardexCompras((kCompras as KardexRow[]) || []);
        setKardexVentas((kVentas as KardexRow[]) || []);
      } catch (e: unknown) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  // PDF
  const descargarPDF = () => {
    if (generandoPDF) return;
    setGenerandoPDF(true);
    try {
      const jsPDF = (window as any).jspdf.jsPDF;
      const doc: any = new jsPDF("landscape");
      const fecha = new Date().toLocaleDateString("es-BO");
      doc.setFontSize(18); doc.text("Market POS — Reporte Kardex", 14, 18);
      doc.setFontSize(10); doc.text("Fecha de generacion: " + fecha, 14, 26);
      doc.setFontSize(13); doc.text("Kardex Compras (Entradas)", 14, 36);
      doc.autoTable({ startY: 40, head: [["Fecha", "Producto", "Cantidad", "Referencia", "Usuario"]], body: kardexCompras.length > 0 ? kardexCompras.map((m) => [formatDate(m.fecha_movimiento), m.producto?.nombre || "—", "+" + m.cantidad, m.referencia || "—", m.usuario?.nombre || "—"]) : [["Sin datos", "", "", "", ""]], theme: "grid", headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 9 } });
      const ac = doc.lastAutoTable.finalY + 12; doc.setFontSize(13); doc.text("Kardex Ventas (Salidas)", 14, ac);
      doc.autoTable({ startY: ac + 4, head: [["Fecha", "Producto", "Cantidad", "Referencia", "Usuario"]], body: kardexVentas.length > 0 ? kardexVentas.map((m) => [formatDate(m.fecha_movimiento), m.producto?.nombre || "—", "-" + m.cantidad, m.referencia || "—", m.usuario?.nombre || "—"]) : [["Sin datos", "", "", "", ""]], theme: "grid", headStyles: { fillColor: [248, 113, 113] }, styles: { fontSize: 9 } });
      doc.save("Reporte_Kardex_" + fecha.replace(/\//g, "-") + ".pdf"); toast.success("PDF descargado");
    } catch (e: any) { toast.error("Error PDF: " + e.message); } finally { setGenerandoPDF(false); }
  };

  const filteredCompras = kardexCompras.filter((m) => { if (!searchCompras) return true; const text = `${m.producto?.nombre || ""} ${m.referencia || ""} ${m.usuario?.nombre || ""}`.toLowerCase(); return text.includes(searchCompras.toLowerCase()); });
  const filteredVentas = kardexVentas.filter((m) => { if (!searchVentas) return true; const text = `${m.producto?.nombre || ""} ${m.referencia || ""} ${m.usuario?.nombre || ""}`.toLowerCase(); return text.includes(searchVentas.toLowerCase()); });

  const stats = [
    { label: "Empleados activos", value: loading ? "—" : statPersonal.toString(), icon: Users, color: "bg-blue-500/10 text-blue-400" },
    { label: "Compras registradas", value: loading ? "—" : statCompras.toString(), icon: ShoppingCart, color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Ventas realizadas", value: loading ? "—" : statVentas.toString(), icon: Banknote, color: "bg-violet-500/10 text-violet-400" },
    { label: "Ingresos totales", value: loading ? "—" : formatBs(statIngresos), icon: TrendingUp, color: "bg-amber-500/10 text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="group rounded-xl border border-border/60 bg-card/65 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
            <div className={`mb-3.5 flex h-11 w-11 items-center justify-center rounded-lg ${s.color}`}><Icon className="h-5 w-5" /></div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ); })}
      </div>

      {/* Gráficos y Alertas */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Gráfico Top Productos */}
        <div className="xl:col-span-2 overflow-hidden rounded-xl border border-border/60 bg-card/65 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold">🥇 Top 5 Productos Más Vendidos (por unidades)</h3>
          <div className="h-[300px] w-full">
            {loading ? <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div> : topProductos.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-muted-foreground"><Package className="mb-2 h-8 w-8 opacity-30" /><p className="text-sm">Sin datos de ventas</p></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductos} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#ccc', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" name="Unidades" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel Derecho: Ingresos vs Egresos + Stock Bajo */}
        <div className="flex flex-col gap-5">
          {/* Ingresos vs Egresos */}
          <div className="flex-1 overflow-hidden rounded-xl border border-border/60 bg-card/65 p-5 backdrop-blur-sm">
            <h3 className="mb-4 text-sm font-semibold">💰 Ingresos vs Egresos</h3>
            <div className="h-[160px] w-full">
              {loading ? <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ingresosVsEgresos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" hide />
                    <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="ventas" name="Bs Ventas" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="compras" name="Bs Compras" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-3 flex justify-center gap-6 text-xs font-medium">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-emerald-400" /> Ventas: <span className="text-emerald-400">{formatBs(ingresosVsEgresos[0]?.ventas || 0)}</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-red-400" /> Compras: <span className="text-red-400">{formatBs(ingresosVsEgresos[0]?.compras || 0)}</span></div>
            </div>
          </div>

          {/* Alertas Stock Bajo */}
          <div className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Alertas de Stock Bajo
            </div>
            {loading ? <div className="flex justify-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-destructive border-t-transparent" /></div> : stockBajo.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Todo el stock está bien</p> : (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto">
                {stockBajo.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-background/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">{p.codigo_barras || `#${p.id}`}</p>
                    </div>
                    <Badge className="border-0 bg-destructive/15 text-destructive text-xs animate-stock-pulse">
                      Quedan {p.stock}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kardex y PDF */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={descargarPDF} disabled={loading || generandoPDF} className="gap-2 border-border/60 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5">
          {generandoPDF ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <FileDown className="h-4 w-4" />}
          {generandoPDF ? "Generando..." : "Descargar PDF Kardex"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Kardex Compras */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
            <h3 className="flex-1 text-sm font-semibold">Kardex Compras</h3>
            <div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." value={searchCompras} onChange={(e) => setSearchCompras(e.target.value)} className="h-8 w-[180px] bg-background/60 pl-8 text-xs" /></div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /><p className="text-sm">Cargando...</p></div> : filteredCompras.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Package className="mb-3 h-10 w-10 opacity-30" /><p className="text-sm">No hay entradas registradas</p></div> : (
              <table className="w-full border-collapse text-sm"><thead><tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Cant.</th><th className="px-4 py-3">Ref.</th><th className="px-4 py-3">Usuario</th></tr></thead>
              <tbody>{filteredCompras.map((m, i) => (<tr key={i} className="border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground"><td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(m.fecha_movimiento)}</td><td className="px-4 py-2.5 font-medium">{m.producto?.nombre || "—"}</td><td className="px-4 py-2.5"><Badge variant="secondary" className="border-0 bg-emerald-500/10 text-xs text-emerald-400">+{m.cantidad}</Badge></td><td className="px-4 py-2.5 text-muted-foreground">{m.referencia || "—"}</td><td className="px-4 py-2.5 text-muted-foreground">{m.usuario?.nombre || "—"}</td></tr>))}</tbody></table>
            )}
          </div>
        </div>

        {/* Kardex Ventas */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
            <h3 className="flex-1 text-sm font-semibold">Kardex Ventas</h3>
            <div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." value={searchVentas} onChange={(e) => setSearchVentas(e.target.value)} className="h-8 w-[180px] bg-background/60 pl-8 text-xs" /></div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /><p className="text-sm">Cargando...</p></div> : filteredVentas.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Banknote className="mb-3 h-10 w-10 opacity-30" /><p className="text-sm">No hay salidas registradas</p></div> : (
              <table className="w-full border-collapse text-sm"><thead><tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Cant.</th><th className="px-4 py-3">Ref.</th><th className="px-4 py-3">Usuario</th></tr></thead>
              <tbody>{filteredVentas.map((m, i) => (<tr key={i} className="border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground"><td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(m.fecha_movimiento)}</td><td className="px-4 py-2.5 font-medium">{m.producto?.nombre || "—"}</td><td className="px-4 py-2.5"><Badge variant="secondary" className="border-0 bg-destructive/10 text-xs text-destructive">-{m.cantidad}</Badge></td><td className="px-4 py-2.5 text-muted-foreground">{m.referencia || "—"}</td><td className="px-4 py-2.5 text-muted-foreground">{m.usuario?.nombre || "—"}</td></tr>))}</tbody></table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}