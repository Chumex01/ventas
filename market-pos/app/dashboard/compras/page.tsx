"use client";

import { Fragment, useEffect, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Loader2,
  Trash2,
  Check,
  ChevronsUpDown,
  ChevronDown,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  apiGetCompras,
  apiCreateCompra,
  apiGetProveedores,
  apiGetProductos,
} from "@/lib/api";
import type { Compra } from "@/lib/types";
import { toast } from "sonner";

// ===== HELPERS =====
interface DetalleForm {
  key: string;
  nombre: string;
  producto_id: string;
  cantidad: string;
  precio_unitario: string;
}

function formatBs(n: number) {
  return `Bs ${n.toFixed(2)}`;
}

function formatFecha(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ===== SELECT BUSCABLE =====
function ProductSelect({ products, value, onValueChange }: { products: any[]; value: string; onValueChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = products.find((p) => String(p.id) === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between text-sm font-normal h-9">
          {selected ? `${selected.nombre} (${selected.codigo_barras || "#" + selected.id})` : "Buscar producto..."}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Escribí para buscar..." />
          <CommandList>
            <CommandEmpty>No se encontró el producto.</CommandEmpty>
            <CommandGroup>
              {products.map((p: any) => (
                <CommandItem key={p.id} value={`${p.id} ${p.nombre} ${p.codigo_barras || ""}`} onSelect={() => { onValueChange(String(p.id)); setOpen(false); }}>
                  <Check className={`mr-2 h-4 w-4 ${String(p.id) === value ? "opacity-100 text-primary" : "opacity-0"}`} />
                  <span className="flex-1">{p.nombre}</span>
                  <span className="text-xs text-muted-foreground">{p.codigo_barras || `#${p.id}`}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function ComprasPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Compra[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [factura, setFactura] = useState("");
  const [nroFactura, setNroFactura] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);
  const [proveedores, setProveedores] = useState<{ id: number; nombre: string }[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [todosLosProductos, setTodosLosProductos] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchCompras = async () => {
      try {
        const [res, prods] = await Promise.all([
          apiGetCompras().catch(() => []),
          apiGetProductos().catch(() => []),
        ]);
        if (!cancelled) {
          setData(res as Compra[]);
          setTodosLosProductos(prods as any[]);
        }
      } catch (e: unknown) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCompras();
    return () => { cancelled = true; };
  }, []);

  const openCreate = async () => {
    setFactura(""); setNroFactura(""); setProveedorId(""); setDetalles([]); setModalOpen(true); setLoadingModal(true);
    try {
      const [provs, prods] = await Promise.all([apiGetProveedores().catch(() => []), apiGetProductos().catch(() => [])]);
      setProveedores(provs as any[]); setProductos(prods as any[]);
    } catch (e: unknown) { toast.error("Error cargando datos: " + (e instanceof Error ? e.message : "")); }
    finally { setLoadingModal(false); }
    setTimeout(() => addDetalle(), 100);
  };

 const addDetalle = () => setDetalles((prev) => [...prev, { key: `det_${Date.now()}_${Math.random()}`, producto_id: "", cantidad: "", precio_unitario: "", nombre: "" }]);
  const removeDetalle = (key: string) => setDetalles((prev) => prev.filter((d) => d.key !== key));
  const updateDetalle = (key: string, field: keyof DetalleForm, value: string) => setDetalles((prev) => prev.map((d) => (d.key === key ? { ...d, [field]: value } : d)));
  
  const handleProductSelect = (key: string, productoId: string) => {
    const producto = productos.find((p) => String(p.id) === productoId);
    const precio = producto?.precio_compra_promedio || 0;
    setDetalles((prev) => prev.map((d) => (d.key === key ? { ...d, producto_id: productoId, precio_unitario: String(precio) } : d)));
  };

  const total = detalles.reduce((sum, d) => sum + (parseFloat(d.cantidad) || 0) * (parseFloat(d.precio_unitario) || 0), 0);

  const handleSave = async () => {
    if (!factura.trim() || !nroFactura.trim() || !proveedorId) { toast.error("Factura, Nro. de Factura y Proveedor son obligatorios"); return; }
    const detallesValidos = detalles.filter((d) => d.producto_id);
    if (detallesValidos.length === 0) { toast.error("Agregá al menos un producto"); return; }
    for (const d of detallesValidos) { if (!(parseFloat(d.cantidad) > 0)) { toast.error("Cantidad debe ser mayor a 0"); return; } if (isNaN(parseFloat(d.precio_unitario)) || parseFloat(d.precio_unitario) < 0) { toast.error("Precio inválido"); return; } }
    
    setSaving(true);
    try {
      await apiCreateCompra({ factura: factura.trim(), nro_factura: nroFactura.trim(), proveedor_id: parseInt(proveedorId), detalles: detallesValidos.map((d) => ({ producto_id: parseInt(d.producto_id), cantidad: parseFloat(d.cantidad), precio_unitario: parseFloat(d.precio_unitario) })) });
      toast.success("Compra registrada exitosamente"); setModalOpen(false);
      const res = await apiGetCompras(); setData(res as Compra[]);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Error desconocido"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Nueva Compra</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
        <div className="border-b border-border/60 px-5 py-4"><h3 className="text-sm font-semibold">Compras</h3></div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Loader2 className="mb-3 h-6 w-6 animate-spin" /><p className="text-sm">Cargando...</p></div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><ShoppingCart className="mb-3 h-10 w-10 opacity-30" /><p className="text-sm">No hay compras registradas</p></div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-4 py-3">ID</th><th className="px-4 py-3">Factura</th><th className="px-4 py-3">Nro Factura</th><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => {
                  const totalCompra = (c.detalle_compras || []).reduce((s: number, d: any) => s + (d.cantidad * d.precio_unitario), 0);
                  const isExpanded = expandedId === c.id;
                  return (
                    <Fragment key={c.id}>
                      <tr className="cursor-pointer border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                        <td className="px-3 py-3 text-muted-foreground"><ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></td>
                        <td className="px-4 py-3 text-muted-foreground">#{c.id}</td>
                        <td className="px-4 py-3 font-medium">{c.factura}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.nro_factura}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.proveedor?.nombre || "—"}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-400">{formatBs(totalCompra)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.usuario?.nombre}, {c.usuario?.rol?.nombre || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatFecha(c.fecha)}</td>
                        <td className="px-4 py-3">{c.estado ? <Badge variant="secondary" className="border-0 bg-emerald-500/10 text-xs text-emerald-400">Activo</Badge> : <Badge variant="secondary" className="border-0 bg-destructive/10 text-xs text-destructive">Anulado</Badge>}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-t border-border/20 bg-black/10">
                          <td colSpan={9} className="p-0">
                            <div className="p-4">
                              <table className="w-full border-collapse text-xs">
                                <thead>
                                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    <th className="pb-2 pr-4">Producto</th><th className="pb-2 pr-4 text-right">Cantidad</th><th className="pb-2 pr-4 text-right">P. Unitario</th><th className="pb-2 text-right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(c.detalle_compras || []).map((d: any, i: number) => {
                                    const prodData = todosLosProductos.find((p) => p.id === d.producto_id);
                                    const pNombre = d.Producto?.nombre || d.producto?.nombre || prodData?.nombre || `Producto #${d.producto_id}`;
                                    const sub = d.cantidad * d.precio_unitario;
                                    return (
                                      <tr key={i} className="border-t border-border/20">
                                        <td className="py-2 pr-4 font-medium text-foreground">{pNombre}</td>
                                        <td className="py-2 pr-4 text-right text-muted-foreground">{d.cantidad}</td>
                                        <td className="py-2 pr-4 text-right text-muted-foreground">{formatBs(d.precio_unitario)}</td>
                                        <td className="py-2 text-right font-semibold text-foreground">{formatBs(sub)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL NUEVA COMPRA (Sin cambios, igual que antes) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Compra</DialogTitle></DialogHeader>
          {loadingModal ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Loader2 className="mb-3 h-6 w-6 animate-spin" /><p className="text-sm">Cargando...</p></div>
          ) : (
            <div className="grid gap-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Factura *</Label><Input value={factura} onChange={(e) => setFactura(e.target.value)} placeholder="Ej: FAC-001" /></div>
                <div className="space-y-2"><Label>Nro. Factura *</Label><Input value={nroFactura} onChange={(e) => setNroFactura(e.target.value)} placeholder="Ej: 00001" /></div>
              </div>
              <div className="space-y-2"><Label>Proveedor *</Label><Select value={proveedorId} onValueChange={setProveedorId}><SelectTrigger><SelectValue placeholder="Seleccionar proveedor..." /></SelectTrigger><SelectContent>{proveedores.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Productos</Label><Button type="button" variant="outline" size="sm" onClick={addDetalle} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Agregar</Button></div>
                {detalles.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">Hacé clic en &quot;Agregar&quot; para añadir productos</p>}
                <div className="space-y-3">
                  {detalles.map((d) => (
                    <div key={d.key} className="grid grid-cols-[1fr_90px_120px_36px] gap-2 items-end rounded-lg border border-border/40 bg-background/40 p-3">
                      <div className="space-y-1"><span className="text-[11px] text-muted-foreground">Producto</span><ProductSelect products={productos} value={d.producto_id} onValueChange={(val) => handleProductSelect(d.key, val)} /></div>
                      <div className="space-y-1"><span className="text-[11px] text-muted-foreground">Cant.</span><Input type="number" min="1" value={d.cantidad} onChange={(e) => updateDetalle(d.key, "cantidad", e.target.value)} className="h-9 text-sm" /></div>
                      <div className="space-y-1"><span className="text-[11px] text-muted-foreground">Precio Unit.</span><Input type="number" step="0.01" min="0" value={d.precio_unitario} onChange={(e) => updateDetalle(d.key, "precio_unitario", e.target.value)} className="h-9 text-sm" /></div>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeDetalle(d.key)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                {detalles.length > 0 && (<div className="flex justify-end border-t border-border/60 pt-4"><div className="text-right"><span className="text-sm text-muted-foreground">Total estimado: </span><span className="text-xl font-bold text-blue-400">Bs {total.toFixed(2)}</span></div></div>)}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving || loadingModal} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Registrar Compra</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}