import 'server-only';

import type { Document } from 'mongodb';
import { demoProducts, demoStats } from '@/lib/demo/data';
import { database } from './mongo';
import type { Expense, ImportRecord, OrderEvent, Product, ReturnQc, StockMovement } from './repository';

export type ProductDto = {
  id: string;
  name: string;
  sku: string | null;
  unitCostPaise: number;
  available: number;
  damaged: number;
  revision: number;
  createdAt: string | null;
  updatedAt: string | null;
};
export type OrderDto = Omit<OrderEvent, 'createdAt'> & { createdAt: string | null };
export type ReturnQcDto = Omit<ReturnQc, 'createdAt' | 'productId'> & {
  productId: string | null;
  status: 'needs-association' | 'pending' | 'completed';
  createdAt: string | null;
};
export type MovementDto = Omit<StockMovement, 'createdAt'> & { createdAt: string | null };
export type ExpenseDto = Omit<Expense, 'createdAt'> & { createdAt: string | null };
export type ImportDto = Omit<ImportRecord, 'createdAt'> & { createdAt: string | null };

export type DashboardSnapshot = {
  grossSales: number;
  returnsValue: number;
  returnsCount: number;
  orderCount: number;
  available: number;
  damaged: number;
  pendingQc: number;
  stockValue: number;
  recentImports: ImportRecord[];
};

const iso = (value: Date | undefined): string | null => value?.toISOString() ?? null;
const toProductDto = (product: Product | (typeof demoProducts)[number]): ProductDto => ({
  id: '_id' in product ? product._id : product.id,
  name: product.name,
  sku: product.sku || null,
  unitCostPaise: product.unitCost,
  available: product.available,
  damaged: product.damaged,
  revision: product.revision,
  createdAt: '_id' in product ? iso(product.createdAt) : null,
  updatedAt: '_id' in product ? iso(product.updatedAt) : null,
});

export async function overview(): Promise<DashboardSnapshot> {
  if (!process.env.MONGODB_URI) {
    return { grossSales: demoStats.sales, returnsValue: 0, returnsCount: demoStats.returns, orderCount: demoStats.orders, available: demoStats.available, damaged: demoStats.damaged, pendingQc: demoStats.pendingQc, stockValue: demoStats.stockValue, recentImports: [] };
  }
  const db = await database();
  const [allProducts, events, returns, recentImports] = await Promise.all([
    db.collection<Product>('products').find().toArray(), db.collection<OrderEvent>('orderEvents').find().toArray(),
    db.collection<ReturnQc>('returnQc').find().toArray(), db.collection<ImportRecord>('imports').find().sort({ createdAt: -1 }).limit(5).toArray(),
  ]);
  const sales = events.filter((event) => event.type === 'sales');
  const returnEvents = events.filter((event) => event.type === 'returns');
  return { grossSales: sales.reduce((sum, event) => sum + event.grossInvoicePaise, 0), returnsValue: returnEvents.reduce((sum, event) => sum + event.grossInvoicePaise, 0), returnsCount: returnEvents.length, orderCount: sales.length, available: allProducts.reduce((sum, product) => sum + product.available, 0), damaged: allProducts.reduce((sum, product) => sum + product.damaged, 0), pendingQc: returns.filter((record) => record.pending).reduce((sum, record) => sum + record.quantity, 0), stockValue: allProducts.reduce((sum, product) => sum + product.available * product.unitCost, 0), recentImports };
}

export async function products(): Promise<ProductDto[]> {
  if (!process.env.MONGODB_URI) return demoProducts.map(toProductDto);
  return (await database()).collection<Product>('products').find().sort({ name: 1 }).toArray().then((rows) => rows.map(toProductDto));
}

async function records<T extends Document>(name: string): Promise<T[]> {
  if (!process.env.MONGODB_URI) return [];
  const rows = await (await database()).collection<T>(name).find().sort({ createdAt: -1 }).limit(200).toArray();
  return rows as unknown as T[];
}

export async function orderEvents(): Promise<OrderDto[]> {
  return (await records<OrderEvent>('orderEvents')).filter((row) => row.type === 'sales').map((row) => ({ ...row, createdAt: iso(row.createdAt) }));
}
export async function returnQcRecords(): Promise<ReturnQcDto[]> {
  return (await records<ReturnQc>('returnQc')).map((row) => ({ ...row, productId: row.productId ?? null, status: row.pending ? (row.productId ? 'pending' : 'needs-association') : 'completed', createdAt: iso(row.createdAt) }));
}
export async function stockMovements(): Promise<MovementDto[]> {
  return (await records<StockMovement>('stockMovements')).map((row) => ({ ...row, createdAt: iso(row.createdAt) }));
}
export async function expenses(): Promise<ExpenseDto[]> {
  return (await records<Expense>('expenses')).map((row) => ({ ...row, createdAt: iso(row.createdAt) }));
}
