import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const paths=['public/assets/app.js','public/assets/admin.js','public/assets/shared.js','netlify/lib/core.mjs','netlify/functions/auth.mjs','netlify/functions/jobs.mjs','netlify/functions/settings.mjs','netlify/functions/media.mjs','netlify/functions/submissions.mjs'];
for(const p of paths){execFileSync(process.execPath,['--check',p]);console.log('PASS',p)}
for(const p of ['public/index.html','public/admin/index.html','public/site-config.json','netlify.toml'])await stat(p);
let html=await readFile('public/index.html','utf8');
if(!html.includes('name="job-application"')||!html.includes('name="employer-inquiry"'))throw Error('Required forms missing');
const cfg=await readFile('public/site-config.json','utf8');JSON.parse(cfg);
console.log('All static source checks passed. Live Netlify+Gmail requires deployment.');
