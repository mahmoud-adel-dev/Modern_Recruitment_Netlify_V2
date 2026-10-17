import {getStore} from '@netlify/blobs';
import {randomUUID, createHmac, createHash, timingSafeEqual, scryptSync} from 'node:crypto';
export const SETTINGS_KEYS = ['name','logo_url','tagline','page_title','meta_description','hero_eyebrow','hero_title','hero_accent','hero_desc','hero_primary','hero_secondary','hero_image','about_title','about_desc','phone','whatsapp','email','address','license','facebook','footer_text'];
export function json(data,status=200,extras={}) {return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extras}});}
export function fail(message,status=400){return json({error:message},status);}
export function store(name){return getStore({name:`recruitment-${name}`,consistency:'strong'});}
export async function bodyJSON(req,limit=30000){const length=Number(req.headers.get('content-length')||0);if(length>limit)throw Error('الطلب أكبر من الحجم المسموح');const raw=await req.text();if(Buffer.byteLength(raw)>limit)throw Error('الطلب أكبر من الحجم المسموح');try{return JSON.parse(raw);}catch{throw Error('JSON غير صحيح');}}
export function clean(value,max=200){return String(value??'').trim().slice(0,max);}
export function uuid(){return randomUUID();}
export function originValid(req){const origin=req.headers.get('origin');if(!origin)return false;try{return new URL(origin).origin===new URL(req.url).origin;}catch{return false;}}
function key(){const k=process.env.SESSION_SECRET||'';return k.length>=32?k:'';}
export function isConfigured(){return Boolean(key() && process.env.ADMIN_USERNAME && (process.env.ADMIN_PASSWORD_HASH || (process.env.ADMIN_PASSWORD||'').length>=14));}
function eq(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length && timingSafeEqual(x,y);}
export function passwordValid(p){if(!process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_PASSWORD||'').length>=14){const hashed=createHmac('sha256',key()).update(String(p)).digest('hex');const expected=createHmac('sha256',key()).update(process.env.ADMIN_PASSWORD).digest('hex');return eq(hashed,expected);}const parts=(process.env.ADMIN_PASSWORD_HASH||'').split('$');if(parts.length!==3||parts[0]!=='scrypt'||!(/^[a-f0-9]{32,128}$/i.test(parts[1]))||!(/^[a-f0-9]{128}$/i.test(parts[2])))return false;try{return eq(scryptSync(p,parts[1],64).toString('hex'),parts[2]);}catch{return false;}}
function sign(body){return createHmac('sha256',key()).update(body).digest('base64url');}
export function sessionToken(username){const body=Buffer.from(JSON.stringify({u:username,exp:Date.now()+8*3600_000})).toString('base64url');return body+'.'+sign(body);}
export function cookie(token,maxAge=8*3600){return `mr_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;}
export function currentAdmin(req){if(!isConfigured())return false;const found=(req.headers.get('cookie')||'').match(/(?:^|;\s*)mr_admin=([^;]+)/);if(!found)return false;const [body,signature]=found[1].split('.');if(!body||!signature||!eq(sign(body),signature))return false;try{const obj=JSON.parse(Buffer.from(body,'base64url'));return obj.u===process.env.ADMIN_USERNAME && obj.exp>Date.now();}catch{return false;}}
export function requireAdmin(req){return currentAdmin(req)?null:fail('غير مصرح. سجّل الدخول أولًا.',401);}
export function safeWebsiteUrl(value){const s=clean(value,1200);if(!s)return '';if(/^\/api\/media\?kind=(logo|hero)(?:&v=\d+)?$/.test(s))return s;try{const url=new URL(s);return url.protocol==='https:'?url.href:'';}catch{return '';}}
export async function listJSON(name,prefix=''){const st=store(name);const entries=await st.list({prefix});const arr=await Promise.all(entries.blobs.map(({key})=>st.get(key,{type:'json'})));return arr.filter(Boolean).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));}
export async function throttle(req,namespace,max=5,windowMs=3600_000){const ip=(req.headers.get('x-nf-client-connection-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').trim();const fingerprint=createHash('sha256').update(namespace+'|'+ip+'|'+key()).digest('hex').slice(0,36);const s=store('throttle');const id=namespace+'/'+fingerprint;const now=Date.now();const old=await s.get(id,{type:'json'});const next=old&&old.until>now?old:{count:0,until:now+windowMs};if(next.count>=max)return true;await s.setJSON(id,{count:next.count+1,until:next.until});return false;}
export function serverError(err){console.error(err);return fail('تعذّر تنفيذ العملية. حاول مرة أخرى أو تواصل مع مسؤول الموقع.',500);}
