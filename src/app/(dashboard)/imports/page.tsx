import { products } from '@/lib/server/reads'; import ImportWorkspace from '@/features/imports/workspace';
export default async function Imports() { const allProducts = await products(); return <ImportWorkspace connected={Boolean(process.env.MONGODB_URI)} products={allProducts.map((product) => ({ id: product.id, name: product.name }))} />; }
