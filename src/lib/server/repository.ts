import 'server-only';

import { type ClientSession, type Db, MongoServerError } from 'mongodb';
import type { Parsed } from '@/lib/domain/import-parser';
import { correction, qc, sale, type Balance } from '@/lib/domain/inventory';
import { mongoClient } from './mongo';

export type Product = Balance & { _id: string; name: string; sku?: string; unitCost: number; createdAt?: Date; updatedAt?: Date };
export type ImportRecord = { sha256: string; type: 'sales' | 'returns'; rows: number; createdAt: Date; actor: string };
export type OrderEvent = { identity: string; productId: string | null; sourceRow: number; subOrderNumber: string; date: string; quantity: number; grossInvoicePaise: number; type: 'sales' | 'returns'; status: 'mapped' | 'mapping-needed'; createdAt: Date };
export type ReturnQc = { returnId: string; productId: string | null; quantity: number; good?: number; damaged?: number; pending: boolean; createdAt: Date };
export type StockMovement = { productId: string; delta?: number; damagedDelta?: number; source: 'manual' | 'import' | 'return-qc' | 'purchase' | 'opening'; reason?: string; reference?: string; actor?: string; createdAt: Date };
export type Expense = { amount: number; note: string; actor: string; createdAt: Date };

const now = (): Date => new Date();
const dbName = (): string => process.env.MONGODB_DB || 'inventory_dashboard';

export interface InventoryRepository {
  manual(id: string, target: number, revision: number, reason: string): Promise<void>;
  mappedSale(id: string, qty: number, event: string): Promise<void>;
  returnQc(id: string, returnId: string, qty: number, good: number, damaged: number): Promise<void>;
  createProduct(product: Product): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  purchase(id: string, qty: number, reason: string): Promise<void>;
  expense(amount: number, note: string): Promise<void>;
  commitImport(parsed: Parsed, associations: Record<string, string>): Promise<void>;
}

export class DemoRepository implements InventoryRepository {
  private unavailable(): never { throw new Error('Connect MongoDB to save changes.'); }
  async manual(_id: string, _target: number, _revision: number, _reason: string): Promise<void> { this.unavailable(); }
  async mappedSale(_id: string, _qty: number, _event: string): Promise<void> { this.unavailable(); }
  async returnQc(_id: string, _returnId: string, _qty: number, _good: number, _damaged: number): Promise<void> { this.unavailable(); }
  async createProduct(_product: Product): Promise<void> { this.unavailable(); }
  async deleteProduct(_id: string): Promise<void> { this.unavailable(); }
  async purchase(_id: string, _qty: number, _reason: string): Promise<void> { this.unavailable(); }
  async expense(_amount: number, _note: string): Promise<void> { this.unavailable(); }
  async commitImport(_parsed: Parsed, _associations: Record<string, string>): Promise<void> { this.unavailable(); }
}

export class MongoRepository implements InventoryRepository {
  private async transaction<T>(work: (db: Db, session: ClientSession) => Promise<T>): Promise<T> {
    const client = await mongoClient();
    return client.withSession((session) => session.withTransaction(() => work(client.db(dbName()), session)));
  }

  async manual(id: string, target: number, revision: number, reason: string): Promise<void> {
    await this.transaction(async (db, session) => {
      const product = await db.collection<Product>('products').findOne({ _id: id }, { session });
      if (!product) throw new Error('Product not found');
      const next = correction(product, target, revision);
      const result = await db.collection<Product>('products').updateOne({ _id: id, revision }, { $set: { available: next.available, updatedAt: now() }, $inc: { revision: 1 } }, { session });
      if (!result.modifiedCount) throw new Error('Stale revision: reload before correcting.');
      await db.collection<StockMovement>('stockMovements').insertOne({ productId: id, delta: next.delta, reason, source: 'manual', actor: 'operator', createdAt: now() }, { session });
    });
  }

  async mappedSale(id: string, qty: number, event: string): Promise<void> {
    await this.transaction(async (db, session) => {
      if (await db.collection<OrderEvent>('orderEvents').findOne({ identity: event }, { session })) throw new Error('Event already committed.');
      const product = await db.collection<Product>('products').findOne({ _id: id }, { session });
      if (!product) throw new Error('Product not found');
      const next = sale(product, qty);
      await db.collection<Product>('products').updateOne({ _id: id }, { $set: { available: next.available, updatedAt: now() }, $inc: { revision: 1 } }, { session });
      await db.collection<OrderEvent>('orderEvents').insertOne({ identity: event, productId: id, sourceRow: 0, subOrderNumber: event, date: '', quantity: qty, grossInvoicePaise: 0, type: 'sales', status: 'mapped', createdAt: now() }, { session });
      await db.collection<StockMovement>('stockMovements').insertOne({ productId: id, delta: -qty, source: 'import', reference: event, actor: 'operator', createdAt: now() }, { session });
    });
  }

  async returnQc(id: string, returnId: string, qty: number, good: number, damaged: number): Promise<void> {
    await this.transaction(async (db, session) => {
      const record = await db.collection<ReturnQc>('returnQc').findOne({ returnId }, { session });
      if (!record || !record.pending) throw new Error('Return QC already completed.');
      const productId = record.productId ?? id;
      if (!productId || (record.productId && record.productId !== id)) throw new Error('Return QC does not match the imported return.');
      if (record.productId === null) {
        const event = await db.collection<OrderEvent>('orderEvents').findOne({ identity: returnId, type: 'returns' }, { session });
        if (!event || event.productId !== null || event.quantity !== record.quantity) throw new Error('Return event cannot be associated.');
        const eventResult = await db.collection<OrderEvent>('orderEvents').updateOne({ identity: returnId, type: 'returns', productId: null }, { $set: { productId, status: 'mapped' } }, { session });
        if (!eventResult.modifiedCount) throw new Error('Return association conflict.');
      }
      if (record.quantity !== qty || good + damaged !== record.quantity) throw new Error('QC allocations must equal the imported return quantity.');
      const product = await db.collection<Product>('products').findOne({ _id: productId }, { session });
      if (!product) throw new Error('Product not found');
      const next = qc(product, record.quantity, good, damaged);
      const productResult = await db.collection<Product>('products').updateOne({ _id: productId, revision: product.revision }, { $set: { available: next.available, damaged: next.damaged, updatedAt: now() }, $inc: { revision: 1 } }, { session });
      if (!productResult.modifiedCount) throw new Error('Stock changed; reload and retry.');
      const qcResult = await db.collection<ReturnQc>('returnQc').updateOne({ returnId, pending: true }, { $set: { productId, good, damaged, pending: false } }, { session });
      if (!qcResult.modifiedCount) throw new Error('Return QC conflict.');
      await db.collection<StockMovement>('stockMovements').insertOne({ productId, delta: good, damagedDelta: damaged, source: 'return-qc', reference: returnId, actor: 'operator', createdAt: now() }, { session });
    });
  }

  async createProduct(product: Product): Promise<void> {
    await this.transaction(async (db, session) => {
      const createdAt = now();
      await db.collection<Product>('products').insertOne({ ...product, createdAt, updatedAt: createdAt }, { session });
      await db.collection<StockMovement>('stockMovements').insertOne({ productId: product._id, delta: product.available, source: 'opening', reason: 'Opening stock', actor: 'operator', createdAt }, { session });
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.transaction(async (db, session) => {
      const product = await db.collection<Product>('products').findOne({ _id: id }, { session });
      if (!product) throw new Error('Product not found');
      const [sales, returns] = await Promise.all([
        db.collection<OrderEvent>('orderEvents').countDocuments({ productId: id }, { session }),
        db.collection<ReturnQc>('returnQc').countDocuments({ productId: id }, { session }),
      ]);
      if (sales || returns) throw new Error('Products with imported history cannot be deleted.');
      const result = await db.collection<Product>('products').deleteOne({ _id: id }, { session });
      if (!result.deletedCount) throw new Error('Product was already deleted.');
    });
  }

  async purchase(id: string, qty: number, reason: string): Promise<void> {
    await this.transaction(async (db, session) => {
      const product = await db.collection<Product>('products').findOne({ _id: id }, { session });
      if (!product) throw new Error('Product not found');
      await db.collection<Product>('products').updateOne({ _id: id }, { $inc: { available: qty, revision: 1 }, $set: { updatedAt: now() } }, { session });
      await db.collection<StockMovement>('stockMovements').insertOne({ productId: id, delta: qty, source: 'purchase', reason, actor: 'operator', createdAt: now() }, { session });
    });
  }

  async expense(amount: number, note: string): Promise<void> {
    const db = (await mongoClient()).db(dbName());
    await db.collection<Expense>('expenses').insertOne({ amount, note, actor: 'operator', createdAt: now() });
  }

  async commitImport(parsed: Parsed, associations: Record<string, string>): Promise<void> {
    await this.transaction(async (db, session) => {
      try {
        await db.collection<ImportRecord>('imports').insertOne({ sha256: parsed.sha256, type: parsed.events[0]?.type ?? 'sales', rows: parsed.rows, createdAt: now(), actor: 'operator' }, { session });
      } catch (error: unknown) {
        if (error instanceof MongoServerError && error.code === 11000) throw new Error('File already imported.');
        throw error;
      }
      for (const event of parsed.events) {
        const productId = associations[event.identity] ?? null;
        await db.collection<OrderEvent>('orderEvents').insertOne({ ...event, productId, status: productId ? 'mapped' : 'mapping-needed', createdAt: now() }, { session });
        if (productId && event.type === 'sales') {
          const product = await db.collection<Product>('products').findOne({ _id: productId }, { session });
          if (!product) throw new Error('Product not found');
          const next = sale(product, event.quantity);
          await db.collection<Product>('products').updateOne({ _id: productId }, { $set: { available: next.available, updatedAt: now() }, $inc: { revision: 1 } }, { session });
          await db.collection<StockMovement>('stockMovements').insertOne({ productId, delta: -event.quantity, source: 'import', reference: event.identity, actor: 'operator', createdAt: now() }, { session });
        }
        if (event.type === 'returns') await db.collection<ReturnQc>('returnQc').insertOne({ returnId: event.identity, productId, pending: true, quantity: event.quantity, createdAt: now() }, { session });
      }
    });
  }
}

export const repository = (): InventoryRepository => process.env.MONGODB_URI ? new MongoRepository() : new DemoRepository();
