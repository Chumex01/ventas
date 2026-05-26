"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
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
  apiGetProductos,
  apiCreateProducto,
  apiUpdateProducto,
  apiDeleteProducto,
} from "@/lib/api";
import type { Producto } from "@/lib/types";
import { toast } from "sonner";

// ===== FORM DATA =====
interface ProductoFormData {
  codigo_barras: string;
  nombre: string;
  descripcion: string;
  precio_venta: string;
  precio_compra_promedio: string;
  stock: string;
}

const emptyForm: ProductoFormData = {
  codigo_barras: "",
  nombre: "",
  descripcion: "",
  precio_venta: "",
  precio_compra_promedio: "",
  stock: "0",
};

// ===== COMPONENTE =====
export default function ProductosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductoFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===== FETCH =====
  useEffect(() => {
    let cancelled = false;

    const fetchProductos = async () => {
      try {
        const res = await apiGetProductos();
        if (!cancelled) {
          setData(res as Producto[]);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Error desconocido";
          toast.error(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProductos();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== FILTER =====
  const filtered = data.filter((p) => {
    if (!search) return true;
    const text = `${p.codigo_barras || ""} ${p.nombre} ${p.descripcion || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // ===== STOCK LOW =====
  const isStockLow = (stock: number) => stock >= 0 && stock <= 3;

  // ===== MODAL HELPERS =====
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: Producto) => {
    setEditingId(item.id);
    setForm({
      codigo_barras: item.codigo_barras || "",
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      precio_venta: String(item.precio_venta || 0),
      precio_compra_promedio: String(item.precio_compra_promedio || 0),
      stock: String(item.stock ?? 0),
    });
    setModalOpen(true);
  };

  // ===== SAVE =====
  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }

    const precioVenta = parseFloat(form.precio_venta);
    const precioCompra = parseFloat(form.precio_compra_promedio);
    const stock = parseInt(form.stock);

    if (isNaN(precioVenta) || precioVenta < 0) {
      toast.error("El precio de venta debe ser un número válido");
      return;
    }

    if (isNaN(precioCompra) || precioCompra < 0) {
      toast.error("El precio de compra debe ser un número válido");
      return;
    }

    if (isNaN(stock) || stock < 0) {
      toast.error("El stock debe ser un número válido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        codigo_barras: form.codigo_barras.trim() || null,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio_venta: precioVenta,
        precio_compra_promedio: precioCompra,
        stock: stock,
        activo: true,
      };

      if (editingId) {
        await apiUpdateProducto(editingId, payload);
        toast.success("Producto actualizado correctamente");
      } else {
        await apiCreateProducto(payload);
        toast.success("Producto creado correctamente");
      }

      setModalOpen(false);
      const res = await apiGetProductos();
      setData(res as Producto[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ===== DELETE =====
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteProducto(deleteTarget.id);
      toast.success("Producto eliminado correctamente");
      setDeleteTarget(null);
      const res = await apiGetProductos();
      setData(res as Producto[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="text-sm font-semibold">Productos</h3>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mb-3 h-6 w-6 animate-spin" />
              <p className="text-sm">Cargando...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">
                {search
                  ? "Sin resultados para esa búsqueda"
                  : "No hay productos registrados"}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Código</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Precio Venta</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-border/40 transition-colors hover:bg-primary/[0.03] hover:text-foreground"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {p.codigo_barras || "—"}
                    </td>
                    <td className="px-5 py-3 font-medium">{p.nombre}</td>
                    <td className="px-5 py-3">
                      {isStockLow(p.stock) ? (
                        <Badge className="border-0 bg-destructive/10 text-xs text-destructive animate-stock-pulse">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {p.stock} — STOCK BAJO
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="border-0 bg-emerald-500/10 text-xs text-emerald-400"
                        >
                          {p.stock}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-400">
                      Bs {(p.precio_venta || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      {p.estado ? (
                        <Badge
                          variant="secondary"
                          className="border-0 bg-emerald-500/10 text-xs text-emerald-400"
                        >
                          Activo
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="border-0 bg-destructive/10 text-xs text-destructive"
                        >
                          Inactivo
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(p)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(p)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== MODAL CREAR/EDITAR ===== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código / Sigla</Label>
                <Input
                  value={form.codigo_barras}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, codigo_barras: e.target.value }))
                  }
                  placeholder="Ej: COCA-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock inicial</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Coca Cola 500ml"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                placeholder="Bebida gaseosa (opcional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Venta *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_venta}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, precio_venta: e.target.value }))
                  }
                  placeholder="8.50"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Compra Promedio</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_compra_promedio}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      precio_compra_promedio: e.target.value,
                    }))
                  }
                  placeholder="6.00"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL CONFIRMAR ELIMINACIÓN ===== */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.nombre}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}