"use client";

import { usePathname } from "next/navigation";
import { Boxes } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const routeTitles: Record<string, string> = {
  "/": "Overview",
  "/products": "Products",
  "/orders": "Orders",
  "/returns": "Returns & QC",
  "/purchases": "Purchases",
  "/expenses": "Expenses",
  "/imports": "Imports",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "StockControl";

  return (
    <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
      <SidebarTrigger aria-label="Toggle navigation" />
      <Separator orientation="vertical" className="h-5!" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="hidden text-xs text-muted-foreground sm:block">Inventory operations workspace</p>
      </div>
      <div className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
        <Boxes className="size-3.5 text-primary" />
        Operations
      </div>
    </div>
  );
}
