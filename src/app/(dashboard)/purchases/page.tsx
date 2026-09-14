import { products, stockMovements } from '@/lib/server/reads';
import { OperationForm } from '@/features/operations/forms';

const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-IN') : '—';

export default async function Purchases() {
  const [allProducts, rows] = await Promise.all([products(), stockMovements()]);
  const productMap = Object.fromEntries(allProducts.map((p) => [p.id, p.name]));
  const purchases = rows.filter((row) => row.source === 'purchase');

  return (
    <section>
      <header className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold">Purchases / receipts</h1>
          <p className="mt-2 text-slate-600">Record incoming stock and view purchase history.</p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <OperationForm kind="purchase" products={allProducts.map((p) => ({ id: p.id, name: p.name }))} disabled={!process.env.MONGODB_URI} />
        <div className="card table-wrap">
          <h2 className="text-lg font-bold mb-1">Purchase history</h2>
          <table className="table">
            <caption>{purchases.length} purchase{purchases.length !== 1 ? 's' : ''} recorded</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Product</th>
                <th scope="col">Qty</th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length ? purchases.map((row, i) => (
                <tr key={i}>
                  <td>{fmt(row.createdAt)}</td>
                  <td>{productMap[row.productId] ?? row.productId}</td>
                  <td className="num">{row.delta ?? '—'}</td>
                  <td>{row.reason ?? '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="text-slate-500">No purchase movements yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
