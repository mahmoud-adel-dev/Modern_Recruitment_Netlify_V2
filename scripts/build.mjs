// No bundling for the public HTML/CSS/JS. Netlify's build system bundles functions.
import {stat} from 'node:fs/promises';
for(const p of ['public/index.html','public/admin/index.html','netlify/functions/auth.mjs']) await stat(p);
console.log('Modern Recruitment: public assets and serverless functions ready.');
