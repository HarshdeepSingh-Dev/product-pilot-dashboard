import Link from 'next/link';
import { overview, products } from '@/lib/server/reads';

const money = (n: number): string => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n / 100);

export default async function Overview() {
  const demo = !process.env.MONGODB_URI;
  const [data, list] = await Promise.all([overview(), products()]);
  const cards = [
    { label: 'Gross sales', value: data.grossSales, currency: true },
    { label: 'Orders', value: data.orderCount },
    { label: 'Returns value', value: data.returnsValue, currency: true },
    { label: 'Returns', value: data.returnsCount },
    { label: 'Available units', value: data.available },
    { label: 'Damaged units', value: data.damaged },
    { label: 'Pending QC', value: data.pendingQc },
    { label: 'Stock value', value: data.stockValue, currency: true },
  ];
  return <><header className="flex flex-wrap items-start justify-between gap-4 mb-6"><div><h1 className="text-3xl font-bold">Overview</h1><p className="text-slate-600">Inventory operations and imported event status.</p></div><Link className="btn inline-flex items-center" href="/imports">Upload slip</Link></header><div role="status" className="card mb-5"><span className="badge">{demo ? 'Demo / read-preview' : 'MongoDB connected'}</span><p className="mt-2 text-slate-700">{demo ? 'Connect MongoDB to save changes.' : 'Changes are stored with audited inventory movements.'}</p></div><section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map((card) => <article className="card" key={card.label}><p className="text-sm text-slate-600">{card.label}</p><p className="num text-2xl font-bold mt-2">{card.currency ? money(card.value) : card.value}</p></article>)}</section><section className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5"><div className="card table-wrap"><h2 className="font-bold text-lg">Inventory health</h2><table className="table"><caption>Current product balances</caption><thead><tr><th>Product</th><th>Available</th><th>Damaged</th></tr></thead><tbody>{list.map((product) => <tr key={'_id' in product ? product._id : product.id}><td>{product.name}</td><td>{product.available}</td><td>{product.damaged}</td></tr>)}</tbody></table></div><div className="card"><h2 className="font-bold text-lg">Attention</h2><ul className="mt-3 space-y-2"><li>{demo ? 'Sample imports require explicit product mapping.' : 'Review unmapped events and pending return QC.'}</li><li>Returns do not increase stock until quality control is complete.</li></ul><h2 className="font-bold text-lg mt-5">Recent imports</h2>{data.recentImports.length ? <ul>{data.recentImports.map((item) => <li key={item.sha256}>{item.sha256} · {item.rows} rows</li>)}</ul> : <p className="text-slate-600 mt-2">No persisted imports yet.</p>}</div></section></>;
}
