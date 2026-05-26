"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  ShoppingCart,
  Users,
  Package,
  FileDown,
  Loader2,
  CalendarIcon,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  apiGetVentas,
  apiGetCompras,
  apiGetPersonal,
  apiGetProductos,
} from "@/lib/api";
import type { Venta, Compra, Personal, Producto } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ===== HELPERS =====
function formatBs(n: number) {
  return `Bs ${n.toFixed(2)}`;
}

function formatFecha(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ===== DATE PICKER COMPONENT =====
function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full justify-start text-left font-normal text-sm"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {date ? format(date, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          locale={es}
          initialFocus
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ===== PDF HELPER =====
function generarPDF(
  titulo: string,
  headers: string[],
  rows: string[][],
  nombreArchivo: string
) {
  try {
    const jsPDF = (window as unknown as Record<string, unknown>).jspdf
      .jsPDF as new (orientation?: string) => Record<string, unknown>;
    const doc: Record<string, unknown> = new jsPDF("landscape");
    const fecha = new Date().toLocaleDateString("es-BO");

    (doc.setFontSize as (s: number) => void)(18);
    (doc.text as (t: string, x: number, y: number) => void)(
      `Market POS — ${titulo}`,
      14,
      18
    );
    (doc.setFontSize as (s: number) => void)(10);
    (doc.text as (t: string, x: number, y: number) => void)(
      "Fecha de generacion: " + fecha,
      14,
      26
    );

    (doc.autoTable as (opts: Record<string, unknown>) => void)({
      startY: 35,
      head: [headers],
      body:
        rows.length > 0 ? rows : [["Sin datos para los filtros aplicados"]],
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 9 },
    });

    (doc.save as (n: string) => void)(
      `${nombreArchivo}_${fecha.replace(/\//g, "-")}.pdf`
    );
    toast.success("PDF descargado exitosamente");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    toast.error("Error generando PDF: " + msg);
  }
}

// ===== COMPONENTE PRINCIPAL =====
export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("ventas");

  // --- VENTAS ---
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(true);
  const [vDesde, setVDesde] = useState("");
  const [vHasta, setVHasta] = useState("");
  const [vUsuario, setVUsuario] = useState("");
  const [vMinTotal, setVMinTotal] = useState("");

  // --- COMPRAS ---
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(true);
  const [cDesde, setCDesde] = useState("");
  const [cHasta, setCHasta] = useState("");
  const [cFactura, setCFactura] = useState("");
  const [cNroFactura, setCNroFactura] = useState("");
  const [cProveedor, setCProveedor] = useState("");

  // --- PERSONAL ---
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [pSearch, setPSearch] = useState("");

  // --- PRODUCTOS ---
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [prSearch, setPrSearch] = useState("");

  // ===== FETCH =====
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [v, c, p, pr] = await Promise.all([
          apiGetVentas().catch(() => []),
          apiGetCompras().catch(() => []),
          apiGetPersonal().catch(() => []),
          apiGetProductos().catch(() => []),
        ]);
        if (!cancelled) {
          setVentas(v as Venta[]);
          setCompras(c as Compra[]);
          setPersonal(p as Personal[]);
          setProductos(pr as Producto[]);
        }
      } catch (e: unknown) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) {
          setLoadingVentas(false);
          setLoadingCompras(false);
          setLoadingPersonal(false);
          setLoadingProductos(false);
        }
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== FILTERED DATA =====
  const ventasFiltradas = ventas.filter((v) => {
    const d = new Date(v.fecha).getTime();
    if (vDesde && d < new Date(vDesde).getTime()) return false;
    if (vHasta && d > new Date(vHasta + "T23:59:59").getTime()) return false;
    if (vUsuario && !(v.usuario?.nombre || "").toLowerCase().includes(vUsuario.toLowerCase())) return false;
    const min = parseFloat(vMinTotal) || 0;
    if (min > 0 && (v.total || 0) < min) return false;
    return true;
  });

  const comprasFiltradas = compras.filter((c) => {
    const d = new Date(c.fecha).getTime();
    if (cDesde && d < new Date(cDesde).getTime()) return false;
    if (cHasta && d > new Date(cHasta + "T23:59:59").getTime()) return false;
    if (cFactura && !c.factura.toLowerCase().includes(cFactura.toLowerCase())) return false;
    if (cNroFactura && !c.nro_factura.toLowerCase().includes(cNroFactura.toLowerCase())) return false;
    if (cProveedor && !(c.proveedor?.nombre || "").toLowerCase().includes(cProveedor.toLowerCase())) return false;
    return true;
  });

  const personalFiltrado = personal.filter((p) => {
    if (!pSearch) return true;
    const text = `${p.nombre} ${p.primer_apellido} ${p.email}`.toLowerCase();
    return text.includes(pSearch.toLowerCase());
  });

  const productosFiltrado = productos.filter((p) => {
    if (!prSearch) return true;
    const text = `${p.codigo_barras || ""} ${p.nombre}`.toLowerCase();
    return text.includes(prSearch.toLowerCase());
  });

  // ===== TOTALES =====
  const totalVentas = ventasFiltradas.reduce((s, v) => s + (v.total || 0), 0);
  const totalCompras = comprasFiltradas.reduce((s, c) => {
    return s + (c.detalle_compras || []).reduce((sub: number, d: { cantidad: number; precio_unitario: number }) => sub + d.cantidad * d.precio_unitario, 0);
  }, 0);

  // ===== PDF EXPORTS =====
  const exportVentasPDF = () =>
    generarPDF("Reporte de Ventas", ["ID", "Fecha", "Total", "Items", "Usuario", "Estado"], ventasFiltradas.map((v) => [`#${v.id}`, formatFecha(v.fecha), formatBs(v.total || 0), String(v.detalle_ventas?.length || 0), v.usuario?.nombre || "—", v.estado ? "Activo" : "Anulado"]), "Reporte_Ventas");

  const exportComprasPDF = () =>
    generarPDF("Reporte de Compras", ["ID", "Factura", "Nro Factura", "Proveedor", "Fecha", "Estado"], comprasFiltradas.map((c) => [`#${c.id}`, c.factura, c.nro_factura, c.proveedor?.nombre || "—", formatFecha(c.fecha), c.estado ? "Activo" : "Anulado"]), "Reporte_Compras");

  const exportPersonalPDF = () =>
    generarPDF("Reporte de Personal", ["ID", "Nombre Completo", "Email", "Rol", "Estado"], personalFiltrado.map((p) => [`#${p.id}`, `${p.nombre} ${p.primer_apellido} ${p.segundo_apellido || ""}`, p.email, p.rol?.nombre || "—", p.estado ? "Activo" : "Inactivo"]), "Reporte_Personal");

  const exportProductosPDF = () =>
    generarPDF("Reporte de Productos", ["Código", "Nombre", "Stock", "Precio Venta", "Precio Compra", "Estado"], productosFiltrado.map((p) => [p.codigo_barras || "—", p.nombre, String(p.stock || 0), formatBs(p.precio_venta || 0), formatBs(p.precio_compra_promedio || 0), p.estado ? "Activo" : "Inactivo"]), "Reporte_Productos");

  // ===== UI HELPERS =====
  const RenderSpinner = () => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="mb-3 h-6 w-6 animate-spin" />
      <p className="text-sm">Cargando datos...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card/65 border border-border/60">
          <TabsTrigger value="ventas" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Banknote className="h-4 w-4" />Ventas</TabsTrigger>
          <TabsTrigger value="compras" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><ShoppingCart className="h-4 w-4" />Compras</TabsTrigger>
          <TabsTrigger value="personal" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Users className="h-4 w-4" />Personal</TabsTrigger>
          <TabsTrigger value="productos" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Package className="h-4 w-4" />Productos</TabsTrigger>
        </TabsList>

        {/* ==================== VENTAS ==================== */}
        <TabsContent value="ventas">
          <div className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-border/40 bg-background/40 p-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <DatePicker value={vDesde} onChange={setVDesde} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <DatePicker value={vHasta} onChange={setVHasta} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendedor</Label>
              <Input placeholder="Nombre del usuario..." value={vUsuario} onChange={(e) => setVUsuario(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Total mayor a (Bs)</Label>
              <Input type="number" placeholder="Ej: 20" value={vMinTotal} onChange={(e) => setVMinTotal(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="flex items-end gap-2 col-span-2 lg:col-span-2">
              <Button onClick={exportVentasPDF} disabled={loadingVentas} variant="outline" className="h-9 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"><FileDown className="h-3.5 w-3.5" />PDF</Button>
              <Button variant="ghost" size="sm" onClick={() => { setVDesde(""); setVHasta(""); setVUsuario(""); setVMinTotal(""); }} className="h-9 gap-1.5"><X className="h-3.5 w-3.5" />Limpiar</Button>
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <Badge variant="secondary" className="border-0 bg-emerald-500/10 text-base text-emerald-400 px-4 py-1.5">Total filtrado: {formatBs(totalVentas)}</Badge>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
            <div className="overflow-x-auto">
              {loadingVentas ? <RenderSpinner /> : ventasFiltradas.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Sin resultados</div> : (
                <table className="w-full border-collapse text-sm">
                  <thead><tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">ID</th><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Vendedor</th><th className="px-5 py-3">Estado</th>
                  </tr></thead>
                  <tbody>{ventasFiltradas.map((v) => (
                    <tr key={v.id} className="border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground">
                      <td className="px-5 py-3 text-muted-foreground">#{v.id}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatFecha(v.fecha)}</td>
                      <td className="px-5 py-3 font-bold text-emerald-400">{formatBs(v.total || 0)}</td>
                      <td className="px-5 py-3"><Badge variant="secondary" className="border-0 bg-blue-500/10 text-xs text-blue-400">{v.detalle_ventas?.length || 0}</Badge></td>
                      <td className="px-5 py-3 text-muted-foreground">{v.usuario?.nombre || "—"}</td>
                      <td className="px-5 py-3">{v.estado ? <Badge variant="secondary" className="border-0 bg-emerald-500/10 text-xs text-emerald-400">Activo</Badge> : <Badge variant="secondary" className="border-0 bg-destructive/10 text-xs text-destructive">Anulado</Badge>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ==================== COMPRAS ==================== */}
        <TabsContent value="compras">
          <div className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-border/40 bg-background/40 p-4 sm:grid-cols-2 lg:grid-cols-7">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <DatePicker value={cDesde} onChange={setCDesde} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <DatePicker value={cHasta} onChange={setCHasta} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Factura</Label>
              <Input placeholder="Ej: FAC-001" value={cFactura} onChange={(e) => setCFactura(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nro Factura</Label>
              <Input placeholder="Ej: 0001" value={cNroFactura} onChange={(e) => setCNroFactura(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Proveedor</Label>
              <Input placeholder="Nombre..." value={cProveedor} onChange={(e) => setCProveedor(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="flex items-end gap-2 col-span-2">
              <Button onClick={exportComprasPDF} disabled={loadingCompras} variant="outline" className="h-9 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"><FileDown className="h-3.5 w-3.5" />PDF</Button>
              <Button variant="ghost" size="sm" onClick={() => { setCDesde(""); setCHasta(""); setCFactura(""); setCNroFactura(""); setCProveedor(""); }} className="h-9 gap-1.5"><X className="h-3.5 w-3.5" />Limpiar</Button>
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <Badge variant="secondary" className="border-0 bg-blue-500/10 text-base text-blue-400 px-4 py-1.5">Total filtrado: {formatBs(totalCompras)}</Badge>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
            <div className="overflow-x-auto">
              {loadingCompras ? <RenderSpinner /> : comprasFiltradas.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Sin resultados</div> : (
                <table className="w-full border-collapse text-sm">
                  <thead><tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">ID</th><th className="px-5 py-3">Factura</th><th className="px-5 py-3">Nro Factura</th><th className="px-5 py-3">Proveedor</th><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Estado</th>
                  </tr></thead>
                  <tbody>{comprasFiltradas.map((c) => (
                    <tr key={c.id} className="border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground">
                      <td className="px-5 py-3 text-muted-foreground">#{c.id}</td>
                      <td className="px-5 py-3 font-medium">{c.factura}</td>
                      <td className="px-5 py-3 text-muted-foreground">{c.nro_factura}</td>
                      <td className="px-5 py-3 text-muted-foreground">{c.proveedor?.nombre || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatFecha(c.fecha)}</td>
                      <td className="px-5 py-3">{c.estado ? <Badge variant="secondary" className="border-0 bg-emerald-500/10 text-xs text-emerald-400">Activo</Badge> : <Badge variant="secondary" className="border-0 bg-destructive/10 text-xs text-destructive">Anulado</Badge>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ==================== PERSONAL ==================== */}
        <TabsContent value="personal">
          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-border/40 bg-background/40 p-4">
            <div className="min-w-[250px] flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Buscar por Nombre o Correo</Label>
              <Input placeholder="Juan Pérez o juan@..." value={pSearch} onChange={(e) => setPSearch(e.target.value)} className="h-9 text-sm" />
            </div>
            <Button onClick={exportPersonalPDF} disabled={loadingPersonal} variant="outline" className="h-9 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"><FileDown className="h-3.5 w-3.5" />PDF</Button>
            <Button variant="ghost" size="sm" onClick={() => setPSearch("")} className="h-9 gap-1.5"><X className="h-3.5 w-3.5" />Limpiar</Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
            <div className="overflow-x-auto">
              {loadingPersonal ? <RenderSpinner /> : personalFiltrado.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Sin resultados</div> : (
                <table className="w-full border-collapse text-sm">
                  <thead><tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">ID</th><th className="px-5 py-3">Nombre Completo</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Estado</th>
                  </tr></thead>
                  <tbody>{personalFiltrado.map((p) => (
                    <tr key={p.id} className="border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground">
                      <td className="px-5 py-3 text-muted-foreground">#{p.id}</td>
                      <td className="px-5 py-3 font-medium">{p.nombre} {p.primer_apellido} {p.segundo_apellido || ""}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p.email}</td>
                      <td className="px-5 py-3"><Badge variant="secondary" className="border-0 bg-blue-500/10 text-xs text-blue-400">{p.rol?.nombre || "—"}</Badge></td>
                      <td className="px-5 py-3">{p.estado ? <Badge variant="secondary" className="border-0 bg-emerald-500/10 text-xs text-emerald-400">Activo</Badge> : <Badge variant="secondary" className="border-0 bg-destructive/10 text-xs text-destructive">Inactivo</Badge>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ==================== PRODUCTOS ==================== */}
        <TabsContent value="productos">
          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-border/40 bg-background/40 p-4">
            <div className="min-w-[250px] flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Buscar por Nombre o Código</Label>
              <Input placeholder="Coca Cola o 123456789" value={prSearch} onChange={(e) => setPrSearch(e.target.value)} className="h-9 text-sm" />
            </div>
            <Button onClick={exportProductosPDF} disabled={loadingProductos} variant="outline" className="h-9 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"><FileDown className="h-3.5 w-3.5" />PDF</Button>
            <Button variant="ghost" size="sm" onClick={() => setPrSearch("")} className="h-9 gap-1.5"><X className="h-3.5 w-3.5" />Limpiar</Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
            <div className="overflow-x-auto">
              {loadingProductos ? <RenderSpinner /> : productosFiltrado.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Sin resultados</div> : (
                <table className="w-full border-collapse text-sm">
                  <thead><tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Código</th><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Stock</th><th className="px-5 py-3">Precio Venta</th><th className="px-5 py-3">Precio Compra</th><th className="px-5 py-3">Estado</th>
                  </tr></thead>
                  <tbody>{productosFiltrado.map((p) => (
                    <tr key={p.id} className="border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.codigo_barras || "—"}</td>
                      <td className="px-5 py-3 font-medium">{p.nombre}</td>
                      <td className="px-5 py-3">{p.stock <= 3 ? <Badge className="border-0 bg-destructive/10 text-xs text-destructive animate-stock-pulse">{p.stock} — BAJO</Badge> : <Badge variant="secondary" className="border-0 bg-emerald-500/10 text-xs text-emerald-400">{p.stock}</Badge>}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-400">{formatBs(p.precio_venta || 0)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatBs(p.precio_compra_promedio || 0)}</td>
                      <td className="px-5 py-3">{p.estado ? <Badge variant="secondary" className="border-0 bg-emerald-500/10 text-xs text-emerald-400">Activo</Badge> : <Badge variant="secondary" className="border-0 bg-destructive/10 text-xs text-destructive">Inactivo</Badge>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}