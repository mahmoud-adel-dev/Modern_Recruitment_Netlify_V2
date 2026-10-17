import {json,fail,bodyJSON,originValid,requireAdmin,store,SETTINGS_KEYS,clean,safeWebsiteUrl,serverError} from '../lib/core.mjs';
export default async function(req){try{
 const s=store('settings');
 if(req.method==='GET')return json({settings:await s.get('current',{type:'json'})||{}});
 if(req.method!=='POST')return fail('Method not allowed',405);
 if(!originValid(req))return fail('طلب غير مسموح',403);
 const reject=requireAdmin(req);if(reject)return reject;
 const raw=await bodyJSON(req,18000);if(!raw||typeof raw!=='object'||Array.isArray(raw))return fail('بيانات غير صحيحة');
 const doc={};for(const k of SETTINGS_KEYS){if(!(k in raw))continue;doc[k]=(k==='logo_url'||k==='hero_image'||k==='facebook')?safeWebsiteUrl(raw[k]):clean(raw[k],k==='hero_desc'?700:k==='meta_description'?320:450);}
 await s.setJSON('current',doc);
 return json({ok:true,settings:doc});
}catch(e){return serverError(e);}}
