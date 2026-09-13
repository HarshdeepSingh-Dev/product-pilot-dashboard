import Link from 'next/link';
import { overview, products } from '@/lib/server/reads';

const money = (value: number): string => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value / 100);

export default async function Overview() {
  const demo = !process.env.MONGODB_URI;
  const [data, list] = await Promise.all([overview(), products()]);
  const cards = [
    { label: 'Gross sales', value: data.grossSales, currency: true }, { label: 'Orders', value: data.orderCount },
    { label: 'Returns value', value: data.returnsValue, currency: true }, { label: 'Returns', value: data.returnsCount },
    { label: 'Available units', value: data.available }, { label: 'Damaged units', value: data.damaged },
    { label: 'Pending QC', value: data.pendingQc }, { label: 'Stock value', value: data.stockValue, currency: true },
  ];
  return <>
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Overview</h1><p className="text-slate-600">Inventory operations and imported event status.</p></div><Link className="btn inline-flex items-center" href="/imports">Upload slip</Link></header>
    <div role="status" className="card mb-5"><span className="badge">{demo ? 'Demo / read-preview' : 'MongoDB connected'}</span><p className="mt-2 text-slate-700">{demo ? 'Connect MongoDB to save changes.' : 'Changes are stored with audited inventory movements.'}</p></div>
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <article className="card" key={card.label}><p className="text-sm text-slate-600">{card.label}</p><p className="num mt-2 text-2xl font-bold">{card.currency ? money(card.value) : card.value}</p></article>)}</section>
    <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2"><div className="card table-wrap"><h2 className="text-lg font-bold">Inventory health</h2><table className="table"><caption>Current product balances</caption><thead><tr><th scope="col">Product</th><th scope="col">Available</th><th scope="col">Damaged</th></tr></thead><tbody>{list.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.available}</td><td>{product.damaged}</td></tr>)}</tbody></table></div>
      <div className="card"><h2 className="text-lg font-bold">Attention</h2><ul className="mt-3 space-y-2"><li>{demo ? 'Sample imports require explicit product mapping.' : 'Review unmapped events and pending return QC.'}</li><li>Returns do not increase stock until quality control is complete.</li></ul><h2 className="mt-5 text-lg font-bold">Recent imports</h2>{data.recentImports.length ? <ul>{data.recentImports.map((item) => <li key={item.sha256}>{item.sha256} · {item.rows} rows</li>)}</ul> : <p className="mt-2 text-slate-600">No persisted imports yet.</p>}</div>
    </section>
  </>;
}
