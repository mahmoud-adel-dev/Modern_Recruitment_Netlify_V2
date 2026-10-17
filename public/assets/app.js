(() => {
  const api=window.SiteAPI; let settings={...window.DEFAULT_SITE};let jobs=[];let filters={keyword:'',country:'',sector:''};let lastFocused=null;
  const $=id=>document.getElementById(id);
  const {esc}=api;
  const countries=window.COUNTRIES, sectors=window.SECTORS;
  const sectorIcons={'هندسة ومقاولات':'hard-hat','صحة ورعاية':'stethoscope','فنيون وصيانة':'wrench','نقل ولوجستيات':'truck','ضيافة وخدمات':'users','إدارة ومحاسبة':'briefcase','تعليم':'graduation','قطاعات أخرى':'globe'};
  function imgUrl(v){return api.safeUrl(v,'image');}
  function applySettings(){
    document.querySelectorAll('[data-bind]').forEach(el=>{const key=el.dataset.bind;el.textContent=settings[key]??'';});
    document.title=settings.page_title||window.DEFAULT_SITE.page_title;
    document.querySelector('meta[name="description"]').content=settings.meta_description||'';
    $('heroTitle').innerHTML=esc(settings.hero_title||'').replace(/\n/g,'<br/>');
    $('heroAccent').textContent=settings.hero_accent||'';
    const logo=imgUrl(settings.logo_url);document.querySelectorAll('.brand-emblem').forEach(el=>{el.innerHTML=logo?`<img src="${esc(logo)}" alt="شعار المكتب"/>`:glyph('briefcase');});
    const photo=imgUrl(settings.hero_image);if(photo){$('heroPhoto').src=photo;}
    const phone=String(settings.phone||'').replace(/[^\d+]/g,'');
    const email=String(settings.email||'').trim();
    for(const id of ['contactPhone','footerPhone']){const el=$(id);el.href=phone?`tel:${phone}`:'#contact';const s=el.querySelector('strong');if(s)s.textContent=settings.phone||'أضف رقم المكتب من لوحة الإدارة';else el.textContent='الهاتف: '+(settings.phone||'يُضاف من لوحة الإدارة');}
    for(const id of ['contactEmail','footerEmail']){const el=$(id);el.href=email?`mailto:${encodeURIComponent(email)}`:'#contact';const s=el.querySelector('strong');if(s)s.textContent=email||'أضف البريد من لوحة الإدارة';else el.textContent='البريد: '+(email||'يُضاف من لوحة الإدارة');}
    const wa=String(settings.whatsapp||'').replace(/\D/g,'');const w=$('whatsappFloat');if(wa){w.href=`https://wa.me/${wa}`;w.target='_blank';w.rel='noopener noreferrer';w.setAttribute('aria-label','التواصل عبر واتساب');}else{w.href='#contact';w.removeAttribute('target');}
    $('footerAddress').textContent=settings.address||'';
    const license=$('licenseLine');license.hidden=!settings.license;license.textContent=settings.license?'رقم الترخيص: '+settings.license:'';
  }
  function fillSelect(id,items){const s=$(id);items.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;s.appendChild(o);});}
  function buildSectors(){const descr={'هندسة ومقاولات':'مهندسون ومواقع ومشروعات','صحة ورعاية':'أطباء وتمريض وتخصصات طبية','فنيون وصيانة':'فنيون وحرف وصيانة','نقل ولوجستيات':'سائقون ونقل وتوريدات','ضيافة وخدمات':'فنادق ومطاعم وخدمات','إدارة ومحاسبة':'إداريون وماليون ومبيعات','تعليم':'معلمون وتربويون','قطاعات أخرى':'تخصصات ومجالات إضافية'};
    $('sectorsGrid').innerHTML=sectors.map(s=>`<button type="button" class="sector-card" data-sector="${esc(s)}"><span class="sector-icon">${glyph(sectorIcons[s])}</span><h3>${esc(s)}</h3><p>${esc(descr[s])}</p><span class="sector-arrow">${glyph('arrow-left')}</span></button>`).join('');
    $('sectorsGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-sector]');if(!btn)return;$('jobSector').value=btn.dataset.sector;filters.sector=btn.dataset.sector;renderJobs();document.getElementById('jobs').scrollIntoView({behavior:'smooth'});});
  }
  function renderJobs(){const visible=jobs.filter(j=>j.status==='published').filter(j=>(!filters.keyword||[j.title,j.description,j.requirements,j.sector,j.city].join(' ').toLowerCase().includes(filters.keyword))&&(!filters.country||j.country===filters.country)&&(!filters.sector||j.sector===filters.sector));
    $('demoNotice').hidden=!visible.some(j=>j.is_demo);
    $('jobsGrid').innerHTML=visible.map(j=>{const demo=!!j.is_demo;const icon=sectorIcons[j.sector]||'briefcase';return `<article class="job-card ${demo?'demo':''}"><div class="job-card-top"><span class="job-card-icon">${glyph(icon)}</span><span class="job-card-label">${demo?'مثال توضيحي':'متاحة للتقديم'}</span></div><h3>${esc(j.title)}</h3><div class="job-meta"><span>${glyph('map-pin')}${esc(j.country||'')}${j.city?' • '+esc(j.city):''}</span><span>${glyph('briefcase')}${esc(j.sector||'')}</span><span>${glyph('clock')}${esc(j.experience||'خبرة حسب الإعلان')}</span></div><div class="job-card-divider"></div><div class="job-card-foot"><div><small>التفاصيل / الراتب</small><strong>${esc(j.salary||'حسب تفاصيل الوظيفة')}</strong></div><button type="button" class="card-apply" data-job="${esc(j.id)}" aria-label="تفاصيل ${esc(j.title)}" title="تفاصيل الوظيفة">${glyph('arrow-left')}</button></div></article>`;}).join('');
    $('jobsGrid').hidden=visible.length===0;$('jobsEmpty').hidden=visible.length!==0;
  }
  function openModal(type='apply',job=null){lastFocused=document.activeElement;const isEmployer=type==='employer';$('modalTitle').textContent=isEmployer?'طلب عمالة لشركتك':job?`التقديم: ${job.title}`:'سجّل بياناتك المهنية';$('applyForm').hidden=isEmployer;$('employerForm').hidden=!isEmployer;
    $('applyJobTitle').value=job?.is_demo?'':job?.title||'';$('applyCountry').value=job?.country||'';
    $('applyHint').textContent=job?.is_demo?'هذا مثال فقط، ولن يتم تقديمك إلى وظيفة فعلية.':'';
    $('formModal').hidden=false;document.body.style.overflow='hidden';$('modalClose').focus();
  }
  function closeModal(){ $('formModal').hidden=true;document.body.style.overflow='';if(lastFocused&&lastFocused.isConnected)lastFocused.focus();}
  function jobDetails(job){let el=$('jobDetailModal');if(el)el.remove();el=document.createElement('div');el.id='jobDetailModal';el.className='modal-backdrop';el.innerHTML=`<div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="jobDetailTitle"><div class="modal-header"><div><div class="modal-caption">${job.is_demo?'إعلان تجريبي – غير حقيقي':'تفاصيل فرصة العمل'}</div><h2 id="jobDetailTitle">${esc(job.title)}</h2></div><button type="button" class="icon-button" data-close-detail aria-label="إغلاق">${glyph('x')}</button></div><div class="modal-body"><div class="job-detail-meta"><span>${glyph('map-pin')} ${esc(job.country||'')} ${esc(job.city||'')}</span><span>${glyph('briefcase')} ${esc(job.sector||'')}</span><span>${glyph('clock')} ${esc(job.experience||'')}</span></div><h3>عن الوظيفة</h3><p class="job-detail-text">${esc(job.description||'يرجى التواصل لمعرفة التفاصيل.')}</p><h3>المتطلبات</h3><p class="job-detail-text">${esc(job.requirements||'حسب الإعلان')}</p><div class="job-detail-salary"><strong>الراتب والمزايا</strong><span>${esc(job.salary||'حسب الاتفاق')}</span></div><button type="button" class="btn btn-primary btn-block" data-apply-detail> ${job.is_demo?'جرّب نموذج التقديم':'قدّم على هذه الوظيفة'} ${glyph('arrow-left')}</button></div></div>`;
    document.body.appendChild(el);document.body.style.overflow='hidden';el.querySelector('[data-close-detail]').onclick=()=>{el.remove();document.body.style.overflow='';};el.addEventListener('click',e=>{if(e.target===el){el.remove();document.body.style.overflow='';}});el.querySelector('[data-apply-detail]').onclick=()=>{el.remove();document.body.style.overflow='';openModal('apply',job);};el.querySelector('[data-close-detail]').focus();
  }
  async function submitForm(form,type){
    const button=form.querySelector('button[type="submit"]');if(button.disabled)return;
    const old=button.innerHTML;button.disabled=true;button.textContent='جارٍ إرسال الطلب...';
    const data=Object.fromEntries(new FormData(form));delete data['form-name'];delete data['consent'];
    try{
      if(data['bot-field'])return;delete data['bot-field'];
      const result=type==='apply'?await api.addApplication(data):await api.addInquiry(data);
      closeModal();form.reset();
      api.toast(api.isDemo?'تم تسجيل الطلب كتجربة في نفس المتصفح فقط.':result.emailSent?'تم استلام طلبك وإرسال إشعار إلى المكتب.':'تم حفظ طلبك بنجاح وسيتم مراجعته من لوحة المكتب.');
    }catch(err){console.error(err);api.toast('تعذر إرسال الطلب: '+(err.message||'حدث خطأ'),true);}
    finally{button.disabled=false;button.innerHTML=old;}
  }
  function bind(){
    $('menuBtn').onclick=()=>{const open=$('mobileNav').classList.contains('open');setMenu(!open);};$('closeMenu').onclick=()=>setMenu(false);$('mobileOverlay').onclick=()=>setMenu(false);$('mobileNav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
    function setMenu(isOpen){$('mobileNav').classList.toggle('open',isOpen);$('mobileNav').setAttribute('aria-hidden',String(!isOpen));$('mobileOverlay').hidden=!isOpen;$('menuBtn').setAttribute('aria-expanded',String(isOpen));document.body.style.overflow=isOpen?'hidden':'';}
    window.addEventListener('scroll',()=>{$('siteHeader').classList.toggle('scrolled',window.scrollY>20);},{passive:true});
    for(const id of ['heroApplyBtn','emptyApplyBtn','jobsGeneralApply','contactApplyBtn','footerApplyBtn']) $(id).onclick=()=>openModal('apply');
    $('employerBtn').onclick=()=>openModal('employer');$('modalClose').onclick=closeModal;$('formModal').addEventListener('click',e=>{if(e.target===$('formModal'))closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('formModal').hidden)closeModal();const j=$('jobDetailModal');if(j){j.remove();document.body.style.overflow='';}setMenu(false);}});
    $('jobsGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-job]');if(!btn)return;const job=jobs.find(j=>String(j.id)===btn.dataset.job);if(job)jobDetails(job);});
    $('searchBtn').onclick=filter;$('jobKeyword').addEventListener('keydown',e=>{if(e.key==='Enter')filter();});$('jobCountry').onchange=filter;$('jobSector').onchange=filter;
    $('viewAllJobs').onclick=()=>{$('jobKeyword').value='';$('jobCountry').value='';$('jobSector').value='';filter();};
    $('applyForm').addEventListener('submit',e=>{e.preventDefault();submitForm(e.currentTarget,'apply');});$('employerForm').addEventListener('submit',e=>{e.preventDefault();submitForm(e.currentTarget,'employer');});
    function filter(){filters={keyword:$('jobKeyword').value.trim().toLowerCase(),country:$('jobCountry').value,sector:$('jobSector').value};renderJobs();}
  }
  async function init(){window.paintIcons();fillSelect('jobCountry',countries);fillSelect('jobSector',sectors);fillSelect('applyCountry',countries);fillSelect('employerCountry',countries);buildSectors();bind();$('year').textContent=new Date().getFullYear();
    try{settings=await api.loadSettings();applySettings();}catch(err){console.error(err);api.toast('تعذر تحميل إعدادات الموقع. تأكد من تفعيل Netlify Functions.',true);}
    try{jobs=await api.loadJobs();renderJobs();}catch(err){console.error(err);jobs=[];renderJobs();api.toast('تعذر تحميل قائمة الوظائف',true);}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
