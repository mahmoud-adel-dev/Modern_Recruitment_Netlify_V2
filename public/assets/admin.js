(() => {
  const api=window.SiteAPI;const $=id=>document.getElementById(id);const esc=api.esc;
  const settingKeys=Object.keys(window.DEFAULT_SITE).filter(k=>k!=='logo_url'&&k!=='hero_image'&&k!=='about_title'&&k!=='about_desc');
  const tabs={overview:'لوحة المعلومات',brand:'الهوية والشعار',hero:'الصفحة الرئيسية والهيرو',contact:'بيانات التواصل',seo:'إعدادات SEO',jobs:'إدارة الوظائف',applications:'طلبات المتقدمين',inquiries:'طلبات الشركات'};
  let settings={...window.DEFAULT_SITE};let jobs=[],applications=[],inquiries=[],pendingLogo=null,pendingHero=null,removeLogo=false,removeHero=false;
  let modalFocus=null;
  const escLine=v=>esc(v).replace(/\n/g,'<br/>');
  function makeImage(el,url){el.innerHTML=url?`<img src="${esc(url)}" alt="صورة الشعار"/>`:glyph('briefcase');}
  function drawPreview(){
    $('previewBrandName').textContent=$('f_name').value;
    $('previewBrandTagline').textContent=$('f_tagline').value;
    const logo=removeLogo?'':pendingLogo?.preview||api.safeUrl(settings.logo_url,'image');makeImage($('logoPreview'),logo);makeImage($('previewBrandLogo'),logo);
    $('previewEyebrow').textContent=$('f_hero_eyebrow').value;
    $('previewHeroTitle').innerHTML=escLine($('f_hero_title').value);
    $('previewHeroAccent').textContent=$('f_hero_accent').value;
    $('previewHeroDesc').textContent=$('f_hero_desc').value;
    $('previewHeroButton').textContent=($('f_hero_primary').value||'استكشف الوظائف')+' ←';
    const img=removeHero?'':pendingHero?.preview||api.safeUrl(settings.hero_image,'image');
    $('previewHeroImg').src=img||'../assets/hero-fallback.svg';
    $('adminHeroThumb').src=img||'../assets/hero-fallback.svg';
    $('seoTitlePreview').textContent=$('f_page_title').value;
    $('seoDescPreview').textContent=$('f_meta_description').value;
  }
  function populateInputs(){for(const key of settingKeys){const el=$('f_'+key);if(el)el.value=settings[key]??'';}drawPreview();$('sidebarName').textContent=settings.name;}
  function bindSettings(){document.querySelectorAll('[id^="f_"]').forEach(el=>el.addEventListener('input',drawPreview));
    $('logoUpload').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>4*1024*1024){api.toast('الصورة لازم JPG أو PNG أو WebP وأقل من 4 ميجابايت',true);e.target.value='';return;}if(pendingLogo?.preview)URL.revokeObjectURL(pendingLogo.preview);pendingLogo={file:f,preview:URL.createObjectURL(f)};removeLogo=false;drawPreview();});
    $('heroUpload').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>4*1024*1024){api.toast('حجم الصورة حتى 4 ميجابايت وبصيغة JPG أو PNG أو WebP',true);e.target.value='';return;}if(pendingHero?.preview)URL.revokeObjectURL(pendingHero.preview);pendingHero={file:f,preview:URL.createObjectURL(f)};removeHero=false;drawPreview();});
    $('removeLogo').onclick=()=>{removeLogo=true;pendingLogo=null;$('logoUpload').value='';drawPreview();};$('removeHero').onclick=()=>{removeHero=true;pendingHero=null;$('heroUpload').value='';drawPreview();};
    document.querySelectorAll('[data-save-settings]').forEach(btn=>btn.addEventListener('click',async()=>{
      const original=btn.innerHTML;btn.disabled=true;btn.textContent='جارٍ الحفظ والنشر...';
      try{
        const next={...settings};for(const key of settingKeys){const input=$('f_'+key);if(input)next[key]=input.value.trim();}
        if(removeLogo)next.logo_url='';else if(pendingLogo)next.logo_url=await api.uploadImage(pendingLogo.file,'logo');
        if(removeHero)next.hero_image='';else if(pendingHero)next.hero_image=await api.uploadImage(pendingHero.file,'hero');
        await api.saveSettings(next);settings=next;pendingLogo=null;pendingHero=null;removeLogo=false;removeHero=false;populateInputs();api.toast(api.isDemo?'تم حفظ التغييرات على هذا الجهاز فقط (معاينة).':'تم حفظ ونشر تغييرات الموقع بنجاح.');
      }catch(err){console.error(err);api.toast('فشل حفظ التغييرات: '+(err.message||'خطأ غير معروف'),true);}
      finally{btn.disabled=false;btn.innerHTML=original;}
    }));
  }
  function switchTab(tab){if(!tabs[tab])return;document.querySelectorAll('[data-page]').forEach(el=>el.hidden=el.dataset.page!==tab);document.querySelectorAll('[data-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab));$('breadcrumb').textContent=tabs[tab];$('adminPageTitle').textContent=tabs[tab];window.scrollTo({top:0,behavior:'instant'});setSidebar(false);}
  function setSidebar(on){$('adminSidebar').classList.toggle('open',on);$('adminBackdrop').hidden=!on;}
  function setStats(){const realJobs=jobs.filter(j=>!j.is_demo);$('statJobs').textContent=realJobs.length;$('statPublished').textContent=realJobs.filter(j=>j.status==='published').length;$('statApps').textContent=applications.length;$('statInquiries').textContent=inquiries.length;$('navJobsCount').textContent=realJobs.length;$('navAppsCount').textContent=applications.length;$('navInquiryCount').textContent=inquiries.length;}
  function renderJobs(){const term=$('adminJobSearch').value.trim().toLowerCase(),status=$('adminJobStatus').value;const list=jobs.filter(j=>(!term||[j.title,j.country,j.sector].join(' ').toLowerCase().includes(term))&&(!status||status===j.status));$('jobsTableBody').innerHTML=list.map(j=>`<tr><td><strong>${esc(j.title)}</strong><small>${esc(j.city||'')}${j.is_demo?' — مثال تجريبي':''}</small></td><td>${esc(j.country)}</td><td>${esc(j.sector)}</td><td><span class="state-pill ${j.status==='draft'?'draft':''}">${j.is_demo?'تجريبية':j.status==='published'?'منشورة':'مسودة'}</span></td><td><div class="table-actions"><button type="button" data-job-edit="${esc(j.id)}" title="تعديل" aria-label="تعديل">${glyph('edit')}</button><button type="button" data-job-delete="${esc(j.id)}" class="danger" title="حذف" aria-label="حذف">${glyph('trash')}</button></div></td></tr>`).join('');$('jobsTableEmpty').hidden=list.length>0;setStats();}
  function openJobEditor(job=null){modalFocus=document.activeElement;const f=$('jobEditor');f.reset();$('jobId').value=job?.id||'';$('jobTitle').value=job?.title||'';$('jobCountryInput').value=job?.country||'';$('jobCity').value=job?.city||'';$('jobSectorInput').value=job?.sector||'';$('jobType').value=job?.type||'دوام كامل';$('jobExperience').value=job?.experience||'';$('jobSalary').value=job?.salary||'';$('jobDescription').value=job?.description||'';$('jobRequirements').value=job?.requirements||'';$('jobStatusInput').value=job?.status||'draft';$('jobEditorTitle').textContent=job?'تعديل الإعلان':'إضافة فرصة عمل';$('jobEditorBackdrop').hidden=false;document.body.style.overflow='hidden';$('jobTitle').focus();}
  function closeJobEditor(){$('jobEditorBackdrop').hidden=true;document.body.style.overflow='';modalFocus?.focus?.();}
  async function saveJobForm(e){e.preventDefault();const btn=$('saveJobBtn');btn.disabled=true;const original=btn.innerHTML;btn.textContent='جارٍ الحفظ...';
    const payload={id:$('jobId').value||undefined,title:$('jobTitle').value.trim(),country:$('jobCountryInput').value,city:$('jobCity').value.trim(),sector:$('jobSectorInput').value,type:$('jobType').value.trim(),experience:$('jobExperience').value.trim(),salary:$('jobSalary').value.trim(),description:$('jobDescription').value.trim(),requirements:$('jobRequirements').value.trim(),status:$('jobStatusInput').value};
    if(String(payload.id||'').startsWith('demo-'))payload.id=undefined;
    try{await api.saveJob(payload);jobs=await api.getAdminJobs();renderJobs();closeJobEditor();api.toast('تم حفظ الإعلان بنجاح.');}catch(err){api.toast('فشل حفظ الإعلان: '+(err.message||''),true);}finally{btn.disabled=false;btn.innerHTML=original;}
  }
  function dateShort(s){try{return new Date(s).toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'});}catch{return '—';}}
  function renderApplications(){const term=$('appSearch').value.trim().toLowerCase();const list=applications.filter(a=>[a.name,a.profession,a.phone].join(' ').toLowerCase().includes(term));$('applicationsTableBody').innerHTML=list.map(a=>`<tr><td><strong>${esc(a.name)}</strong><small>${esc(a.job_title||'تسجيل عام')}</small></td><td>${esc(a.profession)}</td><td>${esc(a.country||'—')}</td><td dir="ltr">${esc(a.phone)}</td><td>${dateShort(a.created_at)}</td><td><div class="table-actions"><button aria-label="تفاصيل" type="button" data-app-id="${esc(a.id)}">${glyph('eye')}</button></div></td></tr>`).join('');$('appTableEmpty').hidden=list.length!==0;}
  function renderInquiries(){const term=$('inquirySearch').value.trim().toLowerCase();const list=inquiries.filter(a=>[a.company,a.name,a.profession].join(' ').toLowerCase().includes(term));$('inquiriesTableBody').innerHTML=list.map(a=>`<tr><td><strong>${esc(a.company)}</strong></td><td>${esc(a.name)}</td><td>${esc(a.profession)}</td><td>${esc(a.country||'—')}</td><td dir="ltr">${esc(a.phone)}</td><td><div class="table-actions"><button aria-label="تفاصيل" type="button" data-inquiry-id="${esc(a.id)}">${glyph('eye')}</button></div></td></tr>`).join('');$('inquiryTableEmpty').hidden=list.length!==0;}
  function openRecord(rec,type){if(!rec)return;$('recordTitle').textContent=type==='application'?rec.name:rec.company;const dict=type==='application'?{name:'الاسم',phone:'رقم الهاتف',email:'البريد',profession:'التخصص',country:'الدولة',experience:'الخبرة',job_title:'الوظيفة المطلوبة',message:'ملاحظات',created_at:'تاريخ الطلب'}:{company:'الشركة',name:'مسؤول التواصل',phone:'الهاتف',email:'البريد',profession:'التخصص المطلوب',country:'الدولة',message:'تفاصيل الطلب',created_at:'تاريخ الطلب'};$('recordBody').innerHTML=`<div class="record-list">${Object.entries(dict).map(([key,label])=>`<div class="record-item ${key==='message'?'full':''}"><small>${label}</small><strong>${key==='created_at'?dateShort(rec[key]):esc(rec[key]||'—')}</strong></div>`).join('')}</div>`;$('adminRecordBackdrop').hidden=false;document.body.style.overflow='hidden';$('closeRecord').focus();}
  function csvDownload(arr,keys,name){if(!arr.length){api.toast('لا توجد بيانات لتصديرها',true);return;}const safe=v=>{let text=String(v??'').replace(/\r?\n/g,' ');if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};const data='\ufeff'+[keys.map(k=>safe(k[1])).join(','),...arr.map(item=>keys.map(k=>safe(item[k[0]])).join(','))].join('\r\n');const a=document.createElement('a');const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function bindAdmin(){document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.tab));document.querySelectorAll('[data-go-tab]').forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.goTab));$('adminMenuBtn').onclick=()=>setSidebar(true);$('adminBackdrop').onclick=()=>setSidebar(false);
    bindSettings();$('addJobBtn').onclick=()=>openJobEditor();$('closeJobEditor').onclick=closeJobEditor;$('cancelJobEditor').onclick=closeJobEditor;$('jobEditorBackdrop').addEventListener('click',e=>{if(e.target===$('jobEditorBackdrop'))closeJobEditor();});$('jobEditor').onsubmit=saveJobForm;
    $('adminJobSearch').oninput=renderJobs;$('adminJobStatus').onchange=renderJobs;
    $('jobsTableBody').addEventListener('click',async e=>{const edit=e.target.closest('[data-job-edit]');const del=e.target.closest('[data-job-delete]');if(edit){openJobEditor(jobs.find(j=>String(j.id)===edit.dataset.jobEdit));}if(del){const job=jobs.find(j=>String(j.id)===del.dataset.jobDelete);if(!job||!confirm(`هل تريد حذف إعلان «${job.title}» نهائيًا؟`))return;try{await api.deleteJob(job.id);jobs=await api.getAdminJobs();renderJobs();api.toast('تم حذف الإعلان.');}catch(err){api.toast('فشل الحذف: '+err.message,true);}}});
    $('appSearch').oninput=renderApplications;$('inquirySearch').oninput=renderInquiries;$('applicationsTableBody').addEventListener('click',e=>{const b=e.target.closest('[data-app-id]');if(b)openRecord(applications.find(r=>String(r.id)===b.dataset.appId),'application');});$('inquiriesTableBody').addEventListener('click',e=>{const b=e.target.closest('[data-inquiry-id]');if(b)openRecord(inquiries.find(r=>String(r.id)===b.dataset.inquiryId),'inquiry');});
    $('closeRecord').onclick=()=>{$('adminRecordBackdrop').hidden=true;document.body.style.overflow='';};$('adminRecordBackdrop').addEventListener('click',e=>{if(e.target===$('adminRecordBackdrop'))$('closeRecord').click();});
    $('exportApps').onclick=()=>csvDownload(applications,[['name','الاسم'],['phone','الهاتف'],['email','البريد'],['profession','المهنة'],['country','الدولة'],['experience','الخبرة'],['job_title','الوظيفة'],['message','ملاحظات'],['created_at','التاريخ']],'job-applications.csv');
    $('exportInquiries').onclick=()=>csvDownload(inquiries,[['company','الشركة'],['name','المسؤول'],['phone','الهاتف'],['email','البريد'],['profession','التخصص'],['country','الدولة'],['message','التفاصيل'],['created_at','التاريخ']],'employer-inquiries.csv');
    $('signOutBtn').onclick=async()=>{try{await api.logout();}catch(err){console.warn(err);} $('adminApp').hidden=true;$('loginShell').hidden=false;$('loginPassword').value='';};
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('jobEditorBackdrop').hidden)closeJobEditor();if(!$('adminRecordBackdrop').hidden)$('closeRecord').click();setSidebar(false);}});
  }
  async function loadAll(){try{const [s,j,a,i]=await Promise.all([api.loadSettings(),api.getAdminJobs(),api.getApplications(),api.getInquiries()]);settings=s;jobs=j;applications=a;inquiries=i;populateInputs();renderJobs();renderApplications();renderInquiries();setStats();}catch(err){console.error(err);api.toast('تعذّر تحميل بيانات لوحة التحكم: '+(err.message||''),true);}}
  async function enter(){
    $('loginShell').hidden=true;$('adminApp').hidden=false;
    $('adminModeLabel').textContent=api.isDemo?'معاينة محلية':'إدارة متصلة • Netlify';
    $('adminNotice').hidden=!api.isDemo;
    $('setupCloud').innerHTML=api.isDemo?`${glyph('alert')}<span>التجربة على الجهاز فقط؛ النشر يتطلب Netlify Functions</span>`:`${glyph('check-circle')}<span>التخزين متصل عبر Netlify Blobs</span>`;
    $('setupMail').innerHTML=`${glyph('mail')}<span>الإشعارات ترسل عبر Nodemailer بعد إضافة إعدادات Gmail السرية</span>`;
    await loadAll();switchTab('overview');
  }
  function setupLogin(){
    $('loginForm').hidden=api.isDemo;
    $('demoEnter').hidden=!api.isDemo;
    $('demoLoginNote').hidden=!api.isDemo;
    $('demoEnter').onclick=enter;
    $('loginForm').onsubmit=async e=>{
      e.preventDefault();const btn=$('loginBtn');btn.disabled=true;const old=btn.innerHTML;btn.textContent='جارٍ تسجيل الدخول...';
      try{await api.login($('loginEmail').value.trim(),$('loginPassword').value);$('loginPassword').value='';await enter();}
      catch(err){api.toast('تعذّر تسجيل الدخول: '+(err.message||''),true);}
      finally{btn.disabled=false;btn.innerHTML=old;}
    };
  }
  function init(){
    window.paintIcons();window.COUNTRIES.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;$('jobCountryInput').appendChild(o);});
    window.SECTORS.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;$('jobSectorInput').appendChild(o);});
    bindAdmin();setupLogin();
    if(!api.isDemo){api.session().then(({authenticated,configured})=>{
      if(authenticated)enter();else if(!configured)api.toast('لم يتم إعداد ADMIN_USERNAME و ADMIN_PASSWORD (أو ADMIN_PASSWORD_HASH) و SESSION_SECRET على Netlify.',true);
    }).catch(err=>api.toast('خدمات Netlify غير متاحة: '+err.message,true));}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
