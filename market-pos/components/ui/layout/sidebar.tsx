"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { apiLogout } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  Package,
  Factory,
  ShoppingCart,
  Banknote,
  BarChart3,
  LogOut,
  Store,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const navSections = [
  {
    title: "Principal",
    items: [
      { label: "Inicio", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Reportes", icon: BarChart3, href: "/dashboard/reportes" },
    ],
  },
  {
    title: "Módulos",
    items: [
      { label: "Personal", icon: Users, href: "/dashboard/personal" },
      { label: "Productos", icon: Package, href: "/dashboard/productos" },
      { label: "Proveedores", icon: Factory, href: "/dashboard/proveedores" },
      { label: "Compras", icon: ShoppingCart, href: "/dashboard/compras" },
      { label: "Ventas", icon: Banknote, href: "/dashboard/ventas" },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      /* ignorar */
    }
    clearAuth();
    router.push("/login");
    toast.success("Sesión cerrada");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <Store className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-sm font-bold text-transparent">
            Market POS
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Sistema de Gestión
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    relative mb-0.5 flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-accent" />
                  )}
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border/60 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

/** Sidebar fija para desktop */
export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[260px] flex-col border-r border-border/60 bg-card lg:flex">
      <SidebarContent />
    </aside>
  );
}

/** Sidebar móvil dentro de un Sheet — se usa desde el layout */
export { SidebarContent };