import { collection, products, type Product, type ReturnQc } from '@/lib/server/reads';
import { OperationForm } from '@/features/operations/forms';

export default async function Returns() {
  const [rows, productRows] = await Promise.all([collection('returnQc') as Promise<ReturnQc[]>, products() as Promise<Product[]>]);
  return <section><h1 className="text-3xl font-bold">Returns &amp; QC</h1><div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2"><div className="card table-wrap"><table className="table"><caption>Return quality checks</caption><thead><tr><th scope="col">Return</th><th scope="col">Quantity</th><th scope="col">Status</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.returnId}><td>{row.returnId}</td><td>{row.quantity}</td><td>{row.pending ? 'Pending QC' : 'Completed'}</td></tr>) : <tr><td colSpan={3}>No return QC records yet.</td></tr>}</tbody></table></div><OperationForm kind="qc" products={productRows.map((product) => ({ id: product._id, name: product.name }))} disabled={!process.env.MONGODB_URI} /></div></section>;
}

