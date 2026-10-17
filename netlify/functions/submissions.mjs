import nodemailer from 'nodemailer';
import {json,fail,bodyJSON,originValid,requireAdmin,store,listJSON,clean,uuid,throttle,isConfigured,serverError} from '../lib/core.mjs';
const allowedApp=['name','phone','email','profession','country','experience','job_title','message'];
const allowedCompany=['company','name','phone','email','country','profession','message'];
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validMail=x=>!x||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
async function notify(record,type){
 const {SMTP_USER,SMTP_PASS,NOTIFICATION_EMAIL}=process.env;
 if(!SMTP_USER||!SMTP_PASS||!NOTIFICATION_EMAIL)return false;
 const transporter=nodemailer.createTransport({service:'gmail',auth:{user:SMTP_USER,pass:SMTP_PASS},connectionTimeout:8000,greetingTimeout:6000,socketTimeout:9000});
 const title=type==='apply'?'طلب توظيف جديد':'طلب عمالة من شركة';
 const labels={company:'الشركة',name:'الاسم',phone:'الهاتف',email:'البريد',profession:'المهنة / التخصص',country:'الدولة',experience:'الخبرة',job_title:'الوظيفة',message:'التفاصيل',created_at:'التاريخ'};
 const rows=Object.entries(labels).filter(([k])=>record[k]).map(([k,label])=>`<tr><th style="padding:9px;text-align:right;border:1px solid #ddd">${escapeHtml(label)}</th><td style="padding:9px;border:1px solid #ddd">${escapeHtml(record[k])}</td></tr>`).join('');
 await transporter.sendMail({from:SMTP_USER,to:NOTIFICATION_EMAIL,replyTo:validMail(record.email)&&record.email?record.email:SMTP_USER,subject:`${title} - ${record.name}`,text:Object.entries(labels).filter(([k])=>record[k]).map(([k,label])=>`${label}: ${record[k]}`).join('\n'),html:`<div dir="rtl"><h2>${title}</h2><table style="border-collapse:collapse">${rows}</table></div>`});
 return true;
}
export default async function(req){try{
 const url=new URL(req.url);
 if(req.method==='GET'){
  const reject=requireAdmin(req);if(reject)return reject;
  if(!['apply','employer'].includes(url.searchParams.get('type')))return fail('نوع الطلب غير صحيح');
  const type=url.searchParams.get('type');
  return json({records:await listJSON(type==='apply'?'applications':'companies','submission/')});
 }
 if(req.method!=='POST')return fail('Method not allowed',405);
 if(!originValid(req))return fail('طلب غير مسموح',403);
 if(!isConfigured())return fail('خدمة استقبال الطلبات غير مفعّلة بعد',503);
 if(await throttle(req,'public-submission',5,3600_000))return fail('تم تجاوز الحد المسموح مؤقتًا. حاول لاحقًا.',429);
 const input=await bodyJSON(req,15000);if(!input||typeof input!=='object'||Array.isArray(input))return fail('بيانات غير صحيحة');
 if(input.website||input['bot-field'])return json({ok:true,received:true}); // honeypot
 const type=input.type;if(!['apply','employer'].includes(type))return fail('نوع الطلب غير صحيح');
 const fields=type==='apply'?allowedApp:allowedCompany;
 const result={id:uuid(),status:'new',created_at:new Date().toISOString()};
 for(const k of fields)result[k]=clean(input[k],k==='message'?1600: k==='email'?180: k==='phone'?35:180);
 if(!result.name||!result.phone||!result.profession||type==='employer'&&(!result.company||!result.email))return fail('أكمل البيانات المطلوبة');
 if(!/^[\d+()\s-]{7,35}$/.test(result.phone)||!validMail(result.email))return fail('راجع رقم الهاتف أو البريد الإلكتروني');
 const s=store(type==='apply'?'applications':'companies');
 await s.setJSON('submission/'+result.id,result,{onlyIfNew:true});
 let emailSent=false;
 try{emailSent=await notify(result,type);}catch(err){console.error('Notification error (record saved):',err);}
 return json({ok:true,received:true,emailSent},201);
}catch(e){return serverError(e);}}
