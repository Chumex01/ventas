"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  UserPlus,
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
  apiGetPersonal,
  apiCreateUsuario,
  apiUpdateUsuario,
  apiDeleteUsuario,
} from "@/lib/api";
import type { Personal } from "@/lib/types";
import { toast } from "sonner";

// ===== FORM DATA =====
interface PersonalFormData {
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  email: string;
  password: string;
  rol: string;
}

const emptyForm: PersonalFormData = {
  nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  email: "",
  password: "",
  rol: "1",
};

// ===== COMPONENTE =====
export default function PersonalPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Personal[]>([]);
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PersonalFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState<Personal | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===== FETCH =====
  useEffect(() => {
    let cancelled = false;

    const fetchPersonal = async () => {
      try {
        const res = await apiGetPersonal();
        if (!cancelled) {
          setData(res as Personal[]);
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

    fetchPersonal();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== FILTER =====
  const filtered = data.filter((p) => {
    if (!search) return true;
    const text = `${p.nombre} ${p.primer_apellido} ${p.segundo_apellido || ""} ${p.email} ${p.rol?.nombre || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // ===== MODAL HELPERS =====
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: Personal) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      primer_apellido: item.primer_apellido,
      segundo_apellido: item.segundo_apellido || "",
      email: item.email,
      password: "",
      rol: item.rol ? String(item.rol.id) : "1",
    });
    setModalOpen(true);
  };

  // ===== SAVE =====
  const handleSave = async () => {
    if (!form.nombre.trim() || !form.primer_apellido.trim() || !form.email.trim()) {
      toast.error("Nombre, apellido y email son obligatorios");
      return;
    }

    if (!editingId && !form.password) {
      toast.error("La contraseña es obligatoria para nuevo personal");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        primer_apellido: form.primer_apellido.trim(),
        segundo_apellido: form.segundo_apellido.trim() || null,
        email: form.email.trim(),
        rol: parseInt(form.rol),
      };

      if (!editingId) {
        payload.password = form.password;
      } else if (form.password) {
        payload.password = form.password;
      }

      if (editingId) {
        await apiUpdateUsuario(editingId, payload);
        toast.success("Personal actualizado correctamente");
      } else {
        await apiCreateUsuario(payload);
        toast.success("Personal creado correctamente");
      }

      setModalOpen(false);
      // Refetch
      const res = await apiGetPersonal();
      setData(res as Personal[]);
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
      await apiDeleteUsuario(deleteTarget.id);
      toast.success("Personal eliminado correctamente");
      setDeleteTarget(null);
      const res = await apiGetPersonal();
      setData(res as Personal[]);
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
            placeholder="Buscar personal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Personal
        </Button>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="text-sm font-semibold">Lista de Personal</h3>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mb-3 h-6 w-6 animate-spin" />
              <p className="text-sm">Cargando...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UserPlus className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">
                {search ? "Sin resultados para esa búsqueda" : "No hay personal registrado"}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/15 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Fecha</th>
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
                    <td className="px-5 py-3 font-medium">
                      {p.nombre} {p.primer_apellido}
                      {p.segundo_apellido ? ` ${p.segundo_apellido}` : ""}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {p.email}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant="secondary"
                        className="border-0 bg-blue-500/10 text-xs text-blue-400"
                      >
                        {p.rol?.nombre || "—"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {p.fecha_creacion
                        ? new Date(p.fecha_creacion).toLocaleDateString("es-BO")
                        : "—"}
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
              {editingId ? "Editar Personal" : "Nuevo Personal"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label>Primer Apellido *</Label>
                <Input
                  value={form.primer_apellido}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, primer_apellido: e.target.value }))
                  }
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Segundo Apellido</Label>
              <Input
                value={form.segundo_apellido}
                onChange={(e) =>
                  setForm((f) => ({ ...f, segundo_apellido: e.target.value }))
                }
                placeholder="García (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="juan@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Contraseña {editingId ? "(dejar vacío si no se cambia)" : "*"}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder={editingId ? "••••••••" : "Mínimo 4 caracteres"}
              />
            </div>

            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select
                value={form.rol}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, rol: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Administrador</SelectItem>
                  <SelectItem value="2">Vendedor</SelectItem>
                </SelectContent>
              </Select>
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
              {editingId ? "Guardar Cambios" : "Crear Personal"}
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
            <DialogTitle>Eliminar Personal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar a{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.nombre} {deleteTarget?.primer_apellido}
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