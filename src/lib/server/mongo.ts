import 'server-only';

import { MongoClient, type Db } from 'mongodb';

let clientPromise: Promise<MongoClient> | undefined;

export function mongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MongoDB is not configured. Connect MongoDB to save changes.');
  clientPromise ??= new MongoClient(uri).connect();
  return clientPromise;
}

export async function database(): Promise<Db> {
  return (await mongoClient()).db(process.env.MONGODB_DB || 'inventory_dashboard');
}

export async function ensureIndexes(): Promise<void> {
  const db = await database();
  await Promise.all([
    db.collection('imports').createIndex({ sha256: 1 }, { unique: true }),
    db.collection('orderEvents').createIndex({ identity: 1 }, { unique: true }),
    db.collection('returnQc').createIndex({ returnId: 1 }, { unique: true }),
    db.collection('products').createIndex({ sku: 1 }, { unique: true, sparse: true }),
    db.collection('skuMappings').createIndex({ marketplace: 1, sku: 1 }, { unique: true }),
  ]);
}
