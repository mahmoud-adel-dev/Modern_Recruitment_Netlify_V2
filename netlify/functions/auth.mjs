import {json, fail, bodyJSON, originValid, isConfigured, currentAdmin, passwordValid, sessionToken, cookie, throttle, serverError} from '../lib/core.mjs';
export default async function(req){
 try{
  if(req.method==='GET')return json({authenticated:currentAdmin(req),configured:isConfigured()});
  if(req.method!=='POST')return fail('Method not allowed',405);
  if(!originValid(req))return fail('طلب غير مسموح',403);
  const payload=await bodyJSON(req,4096);
  if(payload.action==='logout')return json({ok:true},200,{'Set-Cookie':cookie('',0)});
  if(payload.action!=='login')return fail('طلب غير معروف');
  if(!isConfigured())return fail('لم يتم ضبط بيانات الأدمن في متغيرات Netlify',503);
  if(await throttle(req,'admin-login',8,15*60000))return fail('محاولات كثيرة، حاول لاحقًا',429);
  const user=String(payload.username||'');const pass=String(payload.password||'');
  if(user.length>150||pass.length>1024||user!==process.env.ADMIN_USERNAME||!passwordValid(pass))return fail('اسم المستخدم أو كلمة المرور غير صحيحة',401);
  return json({ok:true,authenticated:true},200,{'Set-Cookie':cookie(sessionToken(user))});
 }catch(e){return serverError(e);}
}
