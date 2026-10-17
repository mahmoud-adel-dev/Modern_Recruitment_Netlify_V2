/* Netlify Functions + Netlify Blobs API. Local file:// opens a SAFE demonstration mode. */
(() => {
 const demo=location.protocol==='file:';
 const prefix='mr_netlify_demo_';
 const parse=(k,fallback)=>{try{const x=localStorage.getItem(prefix+k);return x===null?fallback:JSON.parse(x);}catch{return fallback;}};
 const store=(k,v)=>localStorage.setItem(prefix+k,JSON.stringify(v));
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;'}[c]));
 const safeUrl=(value,kind='https')=>{const s=String(value??'').trim();if(!s)return '';if(kind==='image'&&/^\/api\/media\?kind=(logo|hero)(?:&v=\d+)?$/.test(s))return s;
  if(kind==='image'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s))return s;
  try{const u=new URL(s);return u.protocol==='https:'?u.href:'';}catch{return '';} };
 async function req(url,method='GET',data){const r=await fetch(url,{method,credentials:'same-origin',headers:{...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,cache:'no-store'});let result;try{result=await r.json();}catch{throw Error('تعذّر الوصول إلى خدمات Netlify. تأكد من نشر المشروع الكامل.');}if(!r.ok)throw Error(result.error||`خطأ ${r.status}`);return result;}
 async function loadSettings(){if(demo)return {...window.DEFAULT_SITE,...parse('settings',{})};let defaults={};try{const r=await fetch('/site-config.json',{cache:'no-store'});if(r.ok)defaults=await r.json();}catch{} const b=await req('/api/settings');return {...window.DEFAULT_SITE,...defaults,...(b.settings||{})};}
 async function saveSettings(value){if(demo){store('settings',value);return;}await req('/api/settings','POST',value);}
 async function loadJobs(){if(demo){const saved=parse('jobs',null);return saved===null?window.DEMO_JOBS:saved;}return (await req('/api/jobs')).jobs;}
 async function getAdminJobs(){if(demo)return loadJobs();return (await req('/api/jobs?scope=admin')).jobs;}
 async function saveJob(job){if(demo){const jobs=parse('jobs',[]);const id=job.id||'demo-local-'+Date.now();const doc={...job,id,is_demo:false,created_at:job.created_at||new Date().toISOString()};const i=jobs.findIndex(x=>x.id===id);if(i===-1)jobs.unshift(doc);else jobs[i]=doc;store('jobs',jobs);return doc;}return (await req('/api/jobs','POST',job)).job;}
 async function deleteJob(id){if(demo){store('jobs',parse('jobs',[]).filter(j=>j.id!==id));return;}await req('/api/jobs','DELETE',{id});}
 async function addApplication(value){if(demo){store('applications',[{...value,id:Date.now().toString(),created_at:new Date().toISOString()},...parse('applications',[])]);return {emailSent:false};}return await req('/api/submissions','POST',{...value,type:'apply'});}
 async function addInquiry(value){if(demo){store('inquiries',[{...value,id:Date.now().toString(),created_at:new Date().toISOString()},...parse('inquiries',[])]);return {emailSent:false};}return await req('/api/submissions','POST',{...value,type:'employer'});}
 async function getApplications(){if(demo)return parse('applications',[]);return (await req('/api/submissions?type=apply')).records;}
 async function getInquiries(){if(demo)return parse('inquiries',[]);return (await req('/api/submissions?type=employer')).records;}
 async function uploadImage(file,kind){if(!file)return '';if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3*1024*1024)throw Error('الصورة يجب أن تكون JPG/PNG/WebP وبحد أقصى 3 MB.');
  if(demo){return new Promise((resolve,reject)=>{const image=new Image(),blob=URL.createObjectURL(file);image.onload=()=>{try{const scale=Math.min(1,1300/image.width,1300/image.height);const c=document.createElement('canvas');c.width=image.width*scale;c.height=image.height*scale;c.getContext('2d').drawImage(image,0,0,c.width,c.height);URL.revokeObjectURL(blob);resolve(c.toDataURL('image/webp',0.72));}catch(e){reject(e);}};image.onerror=()=>reject(Error('تعذّر قراءة الصورة'));image.src=blob;});}
  const buffer=await file.arrayBuffer();const bytes=new Uint8Array(buffer);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.slice(i,i+16384));
  return (await req('/api/media?kind='+encodeURIComponent(kind),'POST',{type:file.type,base64:btoa(binary)})).url;
 }
 async function login(username,password){return await req('/api/auth','POST',{action:'login',username,password});}
 async function logout(){if(demo)return;await req('/api/auth','POST',{action:'logout'});}
 async function session(){if(demo)return {authenticated:false,configured:false};return await req('/api/auth');}
 function toast(message,error=false){const el=document.getElementById('toast');if(!el){alert(message);return;}el.textContent=message;el.classList.toggle('error',error);el.classList.add('show');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove('show'),4500);}
 window.SiteAPI={isCloud:!demo,isDemo:demo,isLocalPreview:()=>demo,esc,safeUrl,loadSettings,saveSettings,loadJobs,getAdminJobs,saveJob,deleteJob,addApplication,addInquiry,getApplications,getInquiries,uploadImage,login,logout,session,toast,parse,store};
})();
