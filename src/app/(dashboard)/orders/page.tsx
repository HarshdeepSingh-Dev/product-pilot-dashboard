import { collection, type OrderEvent } from '@/lib/server/reads';

export default async function Orders() {
  const rows = await collection('orderEvents') as OrderEvent[];
  return <section><h1 className="text-3xl font-bold">Orders</h1><div className="card table-wrap mt-5"><table className="table"><caption>Imported order events</caption><thead><tr><th scope="col">Date</th><th scope="col">Sub-order</th><th scope="col">Quantity</th><th scope="col">Status</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.identity}><td>{row.date || '—'}</td><td>{row.subOrderNumber}</td><td>{row.quantity}</td><td>{row.status}</td></tr>) : <tr><td colSpan={4}>No imported orders yet.</td></tr>}</tbody></table></div></section>;
}

