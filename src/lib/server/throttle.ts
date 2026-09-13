import 'server-only';
const attempts=new Map<string,{count:number;until:number}>();
export function allowAttempt(key:string){const now=Date.now(),v=attempts.get(key);if(!v||v.until<now){attempts.set(key,{count:1,until:now+60_000});return true}if(v.count>=8)return false;v.count++;return true}
