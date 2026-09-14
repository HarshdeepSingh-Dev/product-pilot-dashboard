import { products, returnQcRecords } from '@/lib/server/reads';
import { OperationForm } from '@/features/operations/forms';

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'completed' ? 'badge-green'
    : status === 'pending' ? 'badge-amber'
    : 'badge-red';
  return <span className={cls}>{status.replace(/-/g, ' ')}</span>;
}

export default async function Returns() {
  const [rows, productRows] = await Promise.all([returnQcRecords(), products()]);
  const pendingReturns = rows.filter((row) => row.status !== 'completed').map((row) => ({
    returnId: row.returnId, productId: row.productId ?? '', quantity: row.quantity,
  }));
  return (
    <section>
      <h1 className="text-3xl font-bold">Returns &amp; QC</h1>
      <p className="mt-2 text-slate-600">Review returned items and complete quality checks.</p>
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card table-wrap">
          <table className="table">
            <caption>Return quality checks</caption>
            <thead>
              <tr>
                <th scope="col">Return</th>
                <th scope="col">Quantity</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((row) => (
                <tr key={row.returnId}>
                  <td>{row.returnId}</td>
                  <td className="num">{row.quantity}</td>
                  <td><StatusBadge status={row.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="text-slate-500">No return QC records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <OperationForm kind="qc" products={productRows.map((p) => ({ id: p.id, name: p.name }))} pendingReturns={pendingReturns} disabled={!process.env.MONGODB_URI} />
      </div>
    </section>
  );
}
