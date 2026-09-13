import 'server-only';

import { database } from './mongo';
import type { Document } from 'mongodb';
import type { Expense, ImportRecord, OrderEvent, Product, ReturnQc, StockMovement } from './repository';
import { demoProducts, demoStats } from '@/lib/demo/data';

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
export type DashboardProduct = Product | (typeof demoProducts)[number];

export async function overview(): Promise<DashboardSnapshot> {
  if (!process.env.MONGODB_URI) {
    return {
      grossSales: demoStats.sales,
      returnsValue: 0,
      returnsCount: demoStats.returns,
      orderCount: demoStats.orders,
      available: demoStats.available,
      damaged: demoStats.damaged,
      pendingQc: demoStats.pendingQc,
      stockValue: demoStats.stockValue,
      recentImports: [],
    };
  }
  const db = await database();
  const [allProducts, events, returns, recentImports] = await Promise.all([
    db.collection<Product>('products').find().toArray(),
    db.collection<OrderEvent>('orderEvents').find().toArray(),
    db.collection<ReturnQc>('returnQc').find().toArray(),
    db.collection<ImportRecord>('imports').find().sort({ createdAt: -1 }).limit(5).toArray(),
  ]);
  const sales = events.filter((event) => event.type === 'sales');
  const returnEvents = events.filter((event) => event.type === 'returns');
  return {
    grossSales: sales.reduce((sum, event) => sum + event.grossInvoicePaise, 0),
    returnsValue: returnEvents.reduce((sum, event) => sum + event.grossInvoicePaise, 0),
    returnsCount: returnEvents.length,
    orderCount: sales.length,
    available: allProducts.reduce((sum, product) => sum + product.available, 0),
    damaged: allProducts.reduce((sum, product) => sum + product.damaged, 0),
    pendingQc: returns.filter((record) => record.pending).reduce((sum, record) => sum + record.quantity, 0),
    stockValue: allProducts.reduce((sum, product) => sum + product.available * product.unitCost, 0),
    recentImports,
  };
}

export async function products(): Promise<DashboardProduct[]> {
  if (!process.env.MONGODB_URI) return demoProducts;
  return (await database()).collection<Product>('products').find().toArray();
}

async function records<T extends Document>(name: string): Promise<T[]> {
  if (!process.env.MONGODB_URI) return [];
  return (await database()).collection<T>(name).find().sort({ createdAt: -1 }).limit(200).toArray() as unknown as T[];
}

export const orderEvents = () => records<OrderEvent>('orderEvents');
export const returnQcRecords = () => records<ReturnQc>('returnQc');
export const stockMovements = () => records<StockMovement>('stockMovements');
export const expenses = () => records<Expense>('expenses');
