export type Product={id:string;name:string;variant:string;sku:string;available:number;damaged:number;unitCost:number;revision:number};
export const demoProducts:Product[]=[{id:'p1',name:'Matte Lipstick',variant:'Rosewood',sku:'LIP-ROSE-01',available:42,damaged:2,unitCost:12900,revision:1},{id:'p2',name:'Face Serum',variant:'Vitamin C',sku:'SER-VC-30',available:18,damaged:0,unitCost:24900,revision:1}];
export const demoStats={sales:184900,orders:79,returns:19,available:60,damaged:2,pendingQc:19,stockValue:991800,netSales:139000};
