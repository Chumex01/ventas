"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/personal": "Personal",
  "/dashboard/productos": "Productos",
  "/dashboard/proveedores": "Proveedores",
  "/dashboard/compras": "Compras",
  "/dashboard/reportes": "Reportes",
  "/dashboard/ventas": "Ventas",
  "/dashboard/licencia": "Licencia",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { userName } = useAuthStore();
  const title = pageTitles[pathname] || "Market POS";
  const initial = (userName || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-5 backdrop-blur-md lg:px-7">
      <div className="flex items-center gap-4">
        {/* Botón menú móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card/80 px-3.5 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white">
            {initial}
          </div>
          <span className="hidden text-sm font-medium sm:inline">
            {userName || "Usuario"}
          </span>
        </div>
      </div>
    </header>
  );
}
