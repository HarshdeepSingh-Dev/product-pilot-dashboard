import Link from 'next/link';
import { orderEvents } from '@/lib/server/reads';

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'mapped' ? 'badge-green'
    : status === 'mapping-needed' ? 'badge-red'
    : status === 'pending' || status === 'processing' ? 'badge-amber'
    : 'badge';
  return <span className={cls}>{status.replace(/-/g, ' ')}</span>;
}

export default async function Orders() {
  const rows = await orderEvents();
  return (
    <section>
      <h1 className="text-3xl font-bold">Orders</h1>
      <p className="mt-2 text-slate-600">Imported sale events from uploaded spreadsheets.</p>
      <div className="card table-wrap mt-5">
        <table className="table">
          <caption>Imported order events</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Sub-order</th>
              <th scope="col">Quantity</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.identity}>
                <td>{row.date || '—'}</td>
                <td>{row.subOrderNumber}</td>
                <td className="num">{row.quantity}</td>
                <td><StatusBadge status={row.status} /></td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-slate-500">
                  No imported orders yet.{' '}
                  <Link href="/imports" className="text-blue-600 underline">Upload a sales slip.</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
