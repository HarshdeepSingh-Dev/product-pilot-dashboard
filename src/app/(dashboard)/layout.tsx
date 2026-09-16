import { Boxes, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { NavLinks } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { authenticated, logout } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await authenticated())) redirect("/login");

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-r-0">
        <SidebarHeader className="p-4 pb-3">
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-black/20">
              <Boxes className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight text-white">StockControl</p>
              <p className="text-xs text-sidebar-foreground/55">Inventory workspace</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator className="mx-4 w-auto!" />
        <SidebarContent>
          <SidebarGroup className="px-3 py-4">
            <SidebarGroupLabel className="mb-2 text-[0.68rem] tracking-[0.14em] text-sidebar-foreground/45 uppercase">
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <NavLinks />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <SidebarSeparator className="mb-2" />
          <form
            action={async () => {
              "use server";
              await logout();
              redirect("/login");
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut data-icon="inline-start" />
              Log out
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
          <DashboardHeader />
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
