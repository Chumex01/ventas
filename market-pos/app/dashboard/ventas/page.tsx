"use client";

import { Fragment, useEffect, useState, useCallback, useRef } from "react";
import {
  Banknote, Plus, Loader2, Trash2, Check, ChevronsUpDown,
  Mic, MicOff, ChevronDown, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { apiGetVentas, apiCreateVenta, apiGetProductos } from "@/lib/api";
import { useVoice } from "@/lib/hooks/use-voice";
import type { Venta, Producto } from "@/lib/types";
import { toast } from "sonner";

interface DetalleForm { key: string; producto_id: string; cantidad: string; precio_unitario: string; }

function ProductSelect({ products, value, onValueChange }: { products: Producto[]; value: string; onValueChange: (id: string) => void }) {
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
        <Command><CommandInput placeholder="Escribí para buscar..." /><CommandList><CommandEmpty>No se encontró.</CommandEmpty><CommandGroup>{products.map((p) => (<CommandItem key={p.id} value={`${p.id} ${p.nombre} ${p.codigo_barras || ""}`} onSelect={() => { onValueChange(String(p.id)); setOpen(false); }}><Check className={`mr-2 h-4 w-4 ${String(p.id) === value ? "opacity-100 text-primary" : "opacity-0"}`} /><span className="flex-1">{p.nombre}</span><span className="text-xs text-muted-foreground">{p.codigo_barras || `#${p.id}`}</span></CommandItem>))}</CommandGroup></CommandList></Command>
      </PopoverContent>
    </Popover>
  );
}

export default function VentasPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Venta[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const modalOpenRef = useRef(false);
  useEffect(() => { modalOpenRef.current = modalOpen; }, [modalOpen]);

  useEffect(() => { let c = false; const f = async () => { try { const r = await apiGetVentas(); if (!c) setData(r as Venta[]); } catch (e: unknown) { if (!c) toast.error(e instanceof Error ? e.message : ""); } finally { if (!c) setLoading(false); } }; f(); return () => { c = true; }; }, []);

  const addDetalle = useCallback(() => setDetalles((p) => [...p, { key: `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, producto_id: "", cantidad: "1", precio_unitario: "0" }]), []);
  const removeDetalle = useCallback((k: string) => setDetalles((p) => p.filter((d) => d.key !== k)), []);
  const updateDetalle = useCallback((k: string, f: keyof DetalleForm, v: string) => setDetalles((p) => p.map((d) => (d.key === k ? { ...d, [f]: v } : d))), []);
  const handleProductSelect = useCallback((k: string, pid: string) => { setProductos((pp) => { const pr = pp.find((p) => String(p.id) === pid); setDetalles((prev) => prev.map((d) => (d.key === k ? { ...d, producto_id: pid, precio_unitario: String(pr?.precio_venta || 0) } : d))); return pp; }); }, []);

  const openCreate = useCallback(async () => { if (modalOpenRef.current) return; setDetalles([]); setModalOpen(true); setLoadingModal(true); try { const p = await apiGetProductos().catch(() => []); setProductos(p as Producto[]); } finally { setLoadingModal(false); } setTimeout(() => addDetalle(), 100); }, [addDetalle]);

  // VOZ
  const findProductByVoice = useCallback((s: string): Producto | undefined => { if (!s || productos.length === 0) return undefined; let n = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); if (n.endsWith("s") && n.length > 3) n = n.slice(0, -1); const nn = n.replace(/\s+/g, ""); let m: Producto[] = []; m = productos.filter((p) => { const pn = p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); return pn === n; }); if (!m.length) m = productos.filter((p) => p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "") === nn); if (!m.length) m = productos.filter((p) => { const pn = p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); return pn.startsWith(n) || pn.replace(/\s+/g, "").startsWith(nn); }); if (!m.length) m = productos.filter((p) => { const pn = p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); return pn.includes(n) || pn.replace(/\s+/g, "").includes(nn) || n.includes(pn); }); return m.length ? m.reduce((a, b) => a.nombre.length <= b.nombre.length ? a : b) : undefined; }, [productos]);

  const voiceAddProduct = useCallback((nombre: string, cantidad: number) => { const p = findProductByVoice(nombre); if (!p) { toast.error(`No encontré: "${nombre}"`); return; } setDetalles((prev) => { const ex = prev.find((d) => d.producto_id === String(p.id)); if (ex) return prev.map((d) => d.key === ex.key ? { ...d, cantidad: String((parseInt(ex.cantidad) || 0) + cantidad) } : d); return [...prev, { key: `d_${Date.now()}`, producto_id: String(p.id), cantidad: String(cantidad), precio_unitario: String(p.precio_venta || 0) }]; }); toast.success(`${cantidad}x ${p.nombre} — Bs ${(cantidad * (p.precio_venta || 0)).toFixed(2)}`); }, [findProductByVoice]);

  const voiceRemoveProduct = useCallback((nombre: string, cantidad: number | null) => { const p = findProductByVoice(nombre); if (!p) { toast.error(`No encontré: "${nombre}"`); return; } setDetalles((prev) => { const ex = prev.find((d) => d.producto_id === String(p.id)); if (!ex) { toast.error(`${p.nombre} no está en la venta`); return prev; } if (cantidad && cantidad > 0) { const n = (parseInt(ex.cantidad) || 0) - cantidad; if (n > 0) { toast.success(`Quedan ${n} de ${p.nombre}`); return prev.map((d) => d.key === ex.key ? { ...d, cantidad: String(n) } : d); } } toast.success(`${p.nombre} eliminado`); return prev.filter((d) => d.key !== ex.key); }); }, [findProductByVoice]);

  const voiceClear = useCallback(() => setDetalles([]), []);
  const total = detalles.reduce((s, d) => s + (parseFloat(d.cantidad) || 0) * (parseFloat(d.precio_unitario) || 0), 0);

  const handleSave = useCallback(async () => { const dv = detalles.filter((d) => d.producto_id); if (!dv.length) { toast.error("Agregá al menos un producto"); return; } for (const d of dv) { if (!(parseFloat(d.cantidad) > 0)) { toast.error("Cantidad inválida"); return; } if (isNaN(parseFloat(d.precio_unitario))) { toast.error("Precio inválido"); return; } } setSaving(true); try { await apiCreateVenta({ detalles: dv.map((d) => ({ producto_id: parseInt(d.producto_id), cantidad: parseFloat(d.cantidad), precio_unitario: parseFloat(d.precio_unitario) })) }); toast.success("Venta registrada exitosamente"); setModalOpen(false); setData(await apiGetVentas() as Venta[]); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : ""); } finally { setSaving(false); } }, [detalles]);

  const { listening, transcript, statusMessage, toggle } = useVoice({ onOpenModal: openCreate, onAddProduct: voiceAddProduct, onRemoveProduct: voiceRemoveProduct, onRegisterSale: handleSave, onClear: voiceClear, isModalOpen: modalOpen, productos });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3"><Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Nueva Venta</Button></div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
        <div className="border-b border-border/60 px-5 py-4"><h3 className="text-sm font-semibold">Ventas</h3></div>
        <div className="overflow-x-auto">
          {loading ? (<div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Loader2 className="mb-3 h-6 w-6 animate-spin" /><p className="text-sm">Cargando...</p></div>) : data.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Banknote className="mb-3 h-10 w-10 opacity-30" /><p className="text-sm">No hay ventas registradas</p></div>) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-4 py-3">ID</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((v) => {
                  const isExpanded = expandedId === v.id;
                  return (
                    <Fragment key={v.id}>
                      <tr className="cursor-pointer border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground" onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                        <td className="px-3 py-3 text-muted-foreground"><ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></td>
                        <td className="px-4 py-3 text-muted-foreground">#{v.id}</td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-emerald-400">Bs {(v.total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.usuario?.nombre || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.fecha ? new Date(v.fecha).toLocaleString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="px-4 py-3">{v.estado ? <Badge variant="secondary" className="border-0 bg-emerald-500/10 text-xs text-emerald-400">Activo</Badge> : <Badge variant="secondary" className="border-0 bg-destructive/10 text-xs text-destructive">Anulado</Badge>}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-t border-border/20 bg-black/10">
                          <td colSpan={6} className="p-0">
                            <div className="p-4">
                              <table className="w-full border-collapse text-xs">
                                <thead><tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"><th className="pb-2 pr-4">Producto</th><th className="pb-2 pr-4 text-right">Cantidad</th><th className="pb-2 pr-4 text-right">P. Unitario</th><th className="pb-2 text-right">Subtotal</th></tr></thead>
                                <tbody>
                                  {(v.detalle_ventas || []).map((d: any, i: number) => {
                                    const pNombre = d.producto?.nombre || `Producto #${d.producto_id}`;
                                    const sub = d.cantidad * d.precio_unitario;
                                    return (
                                      <tr key={i} className="border-t border-border/20">
                                        <td className="py-2 pr-4 font-medium text-foreground">{pNombre}</td>
                                        <td className="py-2 pr-4 text-right text-muted-foreground">{d.cantidad}</td>
                                        <td className="py-2 pr-4 text-right text-muted-foreground">Bs {(d.precio_unitario || 0).toFixed(2)}</td>
                                        <td className="py-2 text-right font-semibold text-foreground">Bs {sub.toFixed(2)}</td>
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

      {/* MODAL Y VOZ (Sin cambios) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Venta</DialogTitle></DialogHeader>
          {loadingModal ? (<div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Loader2 className="mb-3 h-6 w-6 animate-spin" /><p className="text-sm">Cargando...</p></div>) : (
            <div className="grid gap-5 py-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Productos</Label><Button type="button" variant="outline" size="sm" onClick={addDetalle} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Agregar</Button></div>
                {detalles.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">Hacé clic en &quot;Agregar&quot; o usá el asistente de voz</p>}
                <div className="space-y-3">{detalles.map((d) => (<div key={d.key} className="grid grid-cols-[1fr_90px_120px_36px] gap-2 items-end rounded-lg border border-border/40 bg-background/40 p-3"><div className="space-y-1"><span className="text-[11px] text-muted-foreground">Producto</span><ProductSelect products={productos} value={d.producto_id} onValueChange={(val) => handleProductSelect(d.key, val)} /></div><div className="space-y-1"><span className="text-[11px] text-muted-foreground">Cant.</span><Input type="number" min="1" value={d.cantidad} onChange={(e) => updateDetalle(d.key, "cantidad", e.target.value)} className="h-9 text-sm" /></div><div className="space-y-1"><span className="text-[11px] text-muted-foreground">Precio Unit.</span><Input type="number" step="0.01" min="0" value={d.precio_unitario} onChange={(e) => updateDetalle(d.key, "precio_unitario", e.target.value)} className="h-9 text-sm" /></div><Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeDetalle(d.key)}><Trash2 className="h-4 w-4" /></Button></div>))}</div>
                {detalles.length > 0 && (<div className="flex justify-end border-t border-border/60 pt-4"><div className="text-right"><span className="text-sm text-muted-foreground">Total: </span><span className="text-2xl font-bold text-emerald-400">Bs {total.toFixed(2)}</span></div></div>)}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving || loadingModal} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Registrar Venta</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <button onClick={toggle} title="Asistente de voz para ventas" className={`fixed bottom-7 right-7 z-[999] flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-xl transition-all duration-300 ${listening ? "bg-gradient-to-br from-destructive to-red-700 text-white animate-voice-pulse" : "bg-gradient-to-br from-primary to-accent text-white hover:-translate-y-0.5 hover:shadow-primary/40"}`}>{listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}</button>
      <div className={`fixed bottom-[100px] right-5 z-[998] w-[320px] rounded-xl border border-border/60 bg-card p-4 shadow-2xl transition-all duration-300 ${listening ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"}`}>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" /></span>Escuchando...</div>
        <p className="mb-3 min-h-[20px] text-sm italic text-muted-foreground">{transcript}</p>
        {statusMessage && <p className="mb-2 text-xs font-medium text-primary">{statusMessage}</p>}
        <div className="border-t border-border/40 pt-2.5 text-[11px] leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground/70">Comandos:</span><br />&quot;vender 2 coca cola&quot; — agregar<br />&quot;quitar fanta&quot; — eliminar<br />&quot;nueva venta&quot; — abrir modal<br />&quot;registrar venta&quot; — guardar<br />&quot;limpiar&quot; — borrar todo<br />&quot;detener&quot; — apagar</div>
      </div>
    </div>
  );
}