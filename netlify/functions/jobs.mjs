import {json,fail,bodyJSON,originValid,requireAdmin,store,listJSON,clean,uuid,serverError} from '../lib/core.mjs';
export default async function(req){try{
 const s=store('jobs');
 if(req.method==='GET'){
  const admin=new URL(req.url).searchParams.get('scope')==='admin';
  if(admin){const rejected=requireAdmin(req);if(rejected)return rejected;}
  const jobs=await listJSON('jobs','job/');
  return json({jobs:admin?jobs:jobs.filter(j=>j.status==='published')});
 }
 if(!['POST','DELETE'].includes(req.method))return fail('Method not allowed',405);
 if(!originValid(req))return fail('طلب غير مسموح',403);
 const rejected=requireAdmin(req);if(rejected)return rejected;
 const body=await bodyJSON(req,19000);
 if(req.method==='DELETE'){
  const id=clean(body.id,60);if(!/^[a-f0-9-]{36}$/.test(id))return fail('معرّف غير صحيح');
  await s.delete('job/'+id);return json({ok:true});
 }
 const title=clean(body.title,150),country=clean(body.country,90),sector=clean(body.sector,100);
 if(!title||!country||!sector)return fail('عنوان الوظيفة والدولة والتخصص مطلوبة');
 const validId=typeof body.id==='string'&&/^[a-f0-9-]{36}$/.test(body.id)?body.id:null;
 const old=validId?await s.get('job/'+validId,{type:'json'}):null;
 if(validId&&!old)return fail('الوظيفة غير موجودة',404);
 const job={id:validId||uuid(),title,country,sector,city:clean(body.city,100),type:clean(body.type,80),experience:clean(body.experience,160),salary:clean(body.salary,200),description:clean(body.description,3100),requirements:clean(body.requirements,3100),status:body.status==='published'?'published':'draft',created_at:old?.created_at||new Date().toISOString(),updated_at:new Date().toISOString()};
 await s.setJSON('job/'+job.id,job);return json({ok:true,job});
}catch(e){return serverError(e);}}
