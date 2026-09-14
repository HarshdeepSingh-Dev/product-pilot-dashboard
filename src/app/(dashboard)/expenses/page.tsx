import { expenses } from '@/lib/server/reads';
import { OperationForm } from '@/features/operations/forms';

const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-IN') : '—';
const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export default async function Expenses() {
  const rows = await expenses();

  return (
    <section>
      <header className="mb-5">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="mt-2 text-slate-600">Track operational costs and view expense history.</p>
      </header>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <OperationForm kind="expense" disabled={!process.env.MONGODB_URI} />
        <div className="card table-wrap">
          <h2 className="text-lg font-bold mb-1">Expense history</h2>
          <table className="table">
            <caption>{rows.length} expense{rows.length !== 1 ? 's' : ''} recorded</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Amount</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((row, i) => (
                <tr key={i}>
                  <td>{fmt(row.createdAt)}</td>
                  <td className="num">{money(row.amount)}</td>
                  <td>{row.note}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="text-slate-500">No expenses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
