"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  Undo2,
  Upload,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const links = [
  ["/", "Overview", LayoutDashboard],
  ["/products", "Products", Package],
  ["/orders", "Orders", ShoppingCart],
  ["/returns", "Returns & QC", Undo2],
  ["/purchases", "Purchases", Truck],
  ["/expenses", "Expenses", Receipt],
  ["/imports", "Imports", Upload],
] as const;

export function NavLinks() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu aria-label="Dashboard navigation">
      {links.map(([href, label, Icon]) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={label}
              className="h-10 text-sidebar-foreground/75 hover:text-sidebar-accent-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
            >
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
