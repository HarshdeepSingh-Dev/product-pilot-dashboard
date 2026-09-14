'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Undo2, Truck, Receipt, Upload } from 'lucide-react';

const links = [
  ['/', 'Overview', LayoutDashboard],
  ['/products', 'Products', Package],
  ['/orders', 'Orders', ShoppingCart],
  ['/returns', 'Returns & QC', Undo2],
  ['/purchases', 'Purchases', Truck],
  ['/expenses', 'Expenses', Receipt],
  ['/imports', 'Imports', Upload],
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav space-y-1" aria-label="Dashboard navigation">
      {links.map(([href, label, Icon]) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            className={`flex gap-3 items-center rounded p-3 transition-colors${active ? ' nav-active' : ' text-slate-300 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white'}`}
            href={href}
            key={href}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
