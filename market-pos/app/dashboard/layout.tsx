"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Sidebar, SidebarContent } from "@/components/ui/layout/sidebar";
import { Header } from "@/components/ui/layout/header";
import { LicenseGuard } from "@/lib/license-guard";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, hydrated, hydrate } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      hydrate();
    }
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

// Reemplazá todo el return del componente por esto:
return (
  <LicenseGuard>
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        {/* ... todo lo demás igual ... */}
      </Sheet>
      <div className="flex min-h-screen flex-col lg:ml-[260px]">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main
          key={pathname}
          className="flex-1 animate-[fadeIn_0.4s_ease] p-5 lg:p-7"
        >
          {children}
        </main>
      </div>
    </div>
  </LicenseGuard>
);
}