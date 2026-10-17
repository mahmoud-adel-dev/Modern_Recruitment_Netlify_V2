import {randomBytes, scryptSync} from 'node:crypto';
import {readline} from 'node:readline/promises';
import {stdin as input, stdout as output} from 'node:process';
const rl=readline.createInterface({input,output});
const pass=await rl.question('كلمة مرور الأدمن (لن تُحفظ في الملفات): ');
rl.close();
if(pass.length<14 || Buffer.byteLength(pass)>1024){console.error('اختر كلمة مرور قوية لا تقل عن 14 حرفًا.'); process.exit(1);}
const salt=randomBytes(24).toString('hex');
const digest=scryptSync(pass,salt,64).toString('hex');
console.log('\nADMIN_PASSWORD_HASH=scrypt$'+salt+'$'+digest);
console.log('SESSION_SECRET='+randomBytes(48).toString('hex'));
console.log('انسخ القيمتين إلى إعدادات Netlify فقط، وليس داخل HTML أو GitHub.');
