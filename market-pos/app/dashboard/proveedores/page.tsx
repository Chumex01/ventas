"use client";

import { useEffect, useState } from "react";
import {
  Factory,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
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
  apiGetProveedores,
  apiCreateProveedor,
  apiUpdateProveedor,
  apiDeleteProveedor,
} from "@/lib/api";
import type { Proveedor } from "@/lib/types";
import { toast } from "sonner";

// ===== FORM DATA =====
interface ProveedorFormData {
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
}

const emptyForm: ProveedorFormData = {
  nombre: "",
  contacto: "",
  telefono: "",
  email: "",
};

// ===== COMPONENTE =====
export default function ProveedoresPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Proveedor[]>([]);
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProveedorFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===== FETCH =====
  useEffect(() => {
    let cancelled = false;

    const fetchProveedores = async () => {
      try {
        const res = await apiGetProveedores();
        if (!cancelled) {
          setData(res as Proveedor[]);
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

    fetchProveedores();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== FILTER =====
  const filtered = data.filter((p) => {
    if (!search) return true;
    const text = `${p.nombre} ${p.contacto || ""} ${p.telefono || ""} ${p.email || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // ===== MODAL HELPERS =====
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: Proveedor) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      contacto: item.contacto || "",
      telefono: item.telefono || "",
      email: item.email || "",
    });
    setModalOpen(true);
  };

  // ===== SAVE =====
  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        contacto: form.contacto.trim() || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
      };

      if (editingId) {
        await apiUpdateProveedor(editingId, payload);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await apiCreateProveedor(payload);
        toast.success("Proveedor creado correctamente");
      }

      setModalOpen(false);
      const res = await apiGetProveedores();
      setData(res as Proveedor[]);
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
      await apiDeleteProveedor(deleteTarget.id);
      toast.success("Proveedor eliminado correctamente");
      setDeleteTarget(null);
      const res = await apiGetProveedores();
      setData(res as Proveedor[]);
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
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="text-sm font-semibold">Proveedores</h3>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mb-3 h-6 w-6 animate-spin" />
              <p className="text-sm">Cargando...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Factory className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">
                {search
                  ? "Sin resultados para esa búsqueda"
                  : "No hay proveedores registrados"}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Contacto</th>
                  <th className="px-5 py-3">Teléfono</th>
                  <th className="px-5 py-3">Email</th>
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
                    <td className="px-5 py-3 text-muted-foreground">
                      #{p.id}
                    </td>
                    <td className="px-5 py-3 font-medium">{p.nombre}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {p.contacto || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {p.telefono || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {p.email || "—"}
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
              {editingId ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Distribuidora ABC"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input
                  value={form.contacto}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contacto: e.target.value }))
                  }
                  placeholder="Carlos Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={form.telefono}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, telefono: e.target.value }))
                  }
                  placeholder="70012345"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="ventas@distabc.com"
              />
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
              {editingId ? "Guardar Cambios" : "Crear Proveedor"}
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
            <DialogTitle>Eliminar Proveedor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar a{" "}
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