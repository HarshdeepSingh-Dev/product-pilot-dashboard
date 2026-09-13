import { products } from '@/lib/server/reads';
import { CreateProduct, ProductMenu } from '@/features/products/product-forms';

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.toLowerCase() ?? '';
  const allProducts = await products();
  const items = allProducts.filter((product) => `${product.name} ${product.sku ?? ''}`.toLowerCase().includes(query));
  const demo = !process.env.MONGODB_URI;
  return <section>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Products</h1><p className="mt-2 text-slate-600">Balances are updated only through audited movements.</p></div>
      <CreateProduct disabled={demo} />
    </header>
    <form className="my-5"><label className="block max-w-md font-medium" htmlFor="q">Search products<input id="q" name="q" defaultValue={query} className="input mt-1" placeholder="Search name or SKU" /></label></form>
    <div className="card table-wrap"><table className="table"><caption>{items.length} products</caption><thead><tr><th scope="col">Product</th><th scope="col">SKU</th><th scope="col">Available</th><th scope="col">Damaged</th><th scope="col">Cost</th><th scope="col">Actions</th></tr></thead><tbody>{items.length ? items.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.sku || '—'}</td><td className="num">{product.available}</td><td className="num">{product.damaged}</td><td className="num">₹{(product.unitCostPaise / 100).toFixed(2)}</td><td><ProductMenu id={product.id} revision={product.revision} disabled={demo} /></td></tr>) : <tr><td colSpan={6}>No products match this search.</td></tr>}</tbody></table></div>
  </section>;
}
