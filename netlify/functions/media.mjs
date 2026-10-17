import {json,fail,bodyJSON,originValid,requireAdmin,store,serverError} from '../lib/core.mjs';
const mimetypes={jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
function magic(bytes,kind){if(kind==='png')return bytes.length>=8&&Buffer.from(bytes.slice(0,8)).equals(Buffer.from([137,80,78,71,13,10,26,10]));if(kind==='jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;if(kind==='webp')return Buffer.from(bytes.slice(0,4)).toString()==='RIFF'&&Buffer.from(bytes.slice(8,12)).toString()==='WEBP';return false;}
export default async function(req){try{
 const kind=new URL(req.url).searchParams.get('kind');if(!['logo','hero'].includes(kind))return fail('نوع الملف غير معروف');
 const s=store('media');
 if(req.method==='GET'){
  const saved=await s.getWithMetadata(kind,{type:'arrayBuffer'});if(!saved)return fail('الصورة غير موجودة',404);
  return new Response(saved.data,{headers:{'Content-Type':saved.metadata?.contentType||'image/webp','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
 }
 if(req.method!=='POST')return fail('Method not allowed',405);
 if(!originValid(req))return fail('طلب غير مسموح',403);
 const rejected=requireAdmin(req);if(rejected)return rejected;
 const {base64,type}=await bodyJSON(req,4_800_000);
 const subtype=Object.keys(mimetypes).find(k=>mimetypes[k]===type);
 if(!subtype||typeof base64!=='string'||base64.length>4_200_000||!/^[a-zA-Z0-9+/]+={0,2}$/.test(base64))return fail('الصورة غير مدعومة أو كبيرة');
 const buf=Buffer.from(base64,'base64');if(buf.length<100||buf.length>3*1024*1024||!magic(buf,subtype))return fail('ملف صورة غير صالح أو يتجاوز 3 MB');
 await s.set(kind,buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),{metadata:{contentType:type}});
 return json({ok:true,url:`/api/media?kind=${kind}&v=${Date.now()}`});
}catch(e){return serverError(e);}}
