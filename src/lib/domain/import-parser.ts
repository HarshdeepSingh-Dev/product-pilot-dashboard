import { createHash } from 'node:crypto';
import * as XLSX from 'xlsx';

export type ImportType = 'sales' | 'returns';
export type ImportEvent = { sourceRow:number; identity:string; subOrderNumber:string; date:string; quantity:number; grossInvoicePaise:number; type:ImportType; mappingNeeded:true };
export type Parsed = { sha256:string; rows:number; quantity:number; invoiceTotal:number; dateRange:string|null; events:ImportEvent[]; duplicates:{identity:string;count:number}[]; errors:string[]; preview:ImportEvent[] };
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s-]+/g,'_');
const value=(row:Record<string,unknown>,name:string)=>row[Object.keys(row).find(k=>normalize(k)===name)||''];

export function parseImport(bytes:ArrayBuffer,type:ImportType,filename:string):Parsed {
  if(bytes.byteLength>5*1024*1024) throw new Error('Maximum upload is 5 MiB.');
  const xlsx=/\.xlsx$/i.test(filename),csv=/\.csv$/i.test(filename);
  if(!xlsx&&!csv) throw new Error('Only .xlsx and .csv are supported.');
  const raw=new Uint8Array(bytes); if(xlsx&&!(raw[0]===0x50&&raw[1]===0x4b)) throw new Error('Invalid XLSX ZIP signature.');
  const book=XLSX.read(bytes,{type:'array',cellFormula:true}); if(!book.SheetNames.length) throw new Error('Workbook is empty.');
  const sheet=book.Sheets[book.SheetNames[0]]; const ref=XLSX.utils.decode_range(sheet['!ref']||'A1'); if(ref.e.c+1>50||ref.e.r>5000) throw new Error('Worksheet exceeds limits.');
  const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:''}); const errors:string[]=[];
  const events=rows.map((row,index)=>{const sourceRow=index+2;const subOrderNumber=String(value(row,'sub_order_num')).trim(); const dateRaw=String(value(row,type==='returns'?'cancel_return_date':'order_date')).trim();const quantity=Number(value(row,'quantity'));const amount=Number(value(row,'total_invoice_value'));
    if(!subOrderNumber) errors.push(`Row ${sourceRow}: sub_order_num is required.`); if(!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)||Number.isNaN(Date.parse(`${dateRaw}T00:00:00Z`))) errors.push(`Row ${sourceRow}: invalid date.`);if(!Number.isInteger(quantity)||quantity<1) errors.push(`Row ${sourceRow}: invalid quantity.`);if(!Number.isFinite(amount)||amount<0) errors.push(`Row ${sourceRow}: invalid invoice value.`);
    return {sourceRow,identity:`tcs:${type}:${subOrderNumber}`,subOrderNumber,date:dateRaw,quantity:Number.isFinite(quantity)?quantity:0,grossInvoicePaise:Math.round((Number.isFinite(amount)?amount:0)*100),type,mappingNeeded:true as const};});
  const counts=new Map<string,number>(); events.forEach(e=>counts.set(e.identity,(counts.get(e.identity)||0)+1)); const duplicates=[...counts].filter(([,count])=>count>1).map(([identity,count])=>({identity,count})); const dates=events.map(e=>e.date).filter(Boolean).sort();
  return {sha256:createHash('sha256').update(Buffer.from(bytes)).digest('hex'),rows:events.length,quantity:events.reduce((n,e)=>n+e.quantity,0),invoiceTotal:events.reduce((n,e)=>n+e.grossInvoicePaise,0),dateRange:dates.length?`${dates[0]} – ${dates.at(-1)}`:null,events,duplicates,errors,preview:events.slice(0,100)};
}
export const parseWorkbook=(bytes:ArrayBuffer,type:ImportType)=>parseImport(bytes,type,'upload.xlsx');
export function validateCommit(parsed:Parsed){if(parsed.duplicates.length)throw new Error('Ambiguous duplicate rows in file.');if(parsed.errors.length)throw new Error('Import has validation errors.');}
