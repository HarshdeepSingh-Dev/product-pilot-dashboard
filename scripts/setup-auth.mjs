import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
const file='.env.local', repair=process.argv.includes('--repair');
const escapeEnv=value=>value.replace(/\\/g,'\\\\').replace(/\$/g,'\\$').replace(/\r?\n/g,'');
let text=existsSync(file)?readFileSync(file,'utf8'):'';
const hashMatch=text.match(/^DASHBOARD_PASSWORD_HASH=(.*)$/m);
if(repair){if(!hashMatch)throw new Error('No DASHBOARD_PASSWORD_HASH found.');text=text.replace(/^DASHBOARD_PASSWORD_HASH=.*$/m,`DASHBOARD_PASSWORD_HASH=${escapeEnv(hashMatch[1].replace(/\\\$/g,'$'))}`);writeFileSync(file,text);console.log('Password hash escaping repaired.');process.exit(0)}
const password=randomBytes(15).toString('base64url');const lines=[];
if(!hashMatch)lines.push(`DASHBOARD_PASSWORD_HASH=${escapeEnv(await bcrypt.hash(password,12))}`);
if(!/^SESSION_SECRET=/m.test(text))lines.push(`SESSION_SECRET=${escapeEnv(randomBytes(32).toString('base64url'))}`);
if(lines.length)writeFileSync(file,text+(text&&!text.endsWith('\n')?'\n':'')+lines.join('\n')+'\n');
console.log(`Dashboard password (shown once): ${password}`);console.log('Existing configured values were preserved.');
-