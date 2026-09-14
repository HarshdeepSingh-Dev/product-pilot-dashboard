import { redirect } from 'next/navigation';
import { authenticated, logout } from '@/lib/server/auth';
import { NavLinks } from '@/components/nav-links';

export default async function Layout({ children }: { children: React.ReactNode }) {
  if (!await authenticated()) redirect('/login');
  return (
    <div className="shell min-h-screen flex">
      <aside className="sidebar w-60 shrink-0 bg-slate-950 text-slate-100 p-4 flex flex-col">
        <div className="text-lg font-bold p-3 mb-2">Stock<span className="text-blue-300">Control</span></div>
        <NavLinks />
        <div className="mt-auto pt-4 border-t border-slate-800">
          <form action={async () => { 'use server'; await logout(); redirect('/login'); }}>
            <button className="w-full text-left p-3 text-slate-400 rounded hover:bg-slate-800 hover:text-slate-100 transition-colors">Log out</button>
          </form>
        </div>
      </aside>
      <main className="main flex-1 p-7 min-w-0">{children}</main>
    </div>
  );
}
