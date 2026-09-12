const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const artifacts = process.env.TEST_ARTIFACTS;
let browser,server,origin,context,page,errors,requests;
const ids=['binInput','octInput','decInput','hexInput','customInput','signMagInput','onesInput','twosInput'];
test.before(async()=>{
  server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(__dirname,'..','index.html')));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || undefined,headless:true});
  if(artifacts)fs.mkdirSync(artifacts,{recursive:true});
});
test.after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});
test.beforeEach(async()=>{
  context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  page=await context.newPage();errors=[];requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(origin);
  if(process.env.TEST_THEME==='dark')await page.locator('#themeToggle').click();
});
test.afterEach(async()=>{
  const caught=errors.slice(),external=requests.filter(u=>/^https?:/.test(u)&&!u.startsWith(origin));
  await context.close();assert.deepEqual(caught,[]);assert.deepEqual(external,[]);
});
async function width(n){
  if([4,8,16,32,64].includes(n)) await page.locator('#bitWidth').selectOption(String(n));
  else {await page.locator('#bitWidth').selectOption('custom');await page.locator('#customBitWidth').fill(String(n));}
}
async function values(){return page.evaluate(ids=>Object.fromEntries(ids.map(id=>[id,document.getElementById(id).value.replace(/\s/g,'')])),ids);}
async function text(id){return page.locator('#'+id).textContent();}

test('preserve the signed-left / encoded-right convention',async()=>{
  await page.locator('#decInput').fill('-59');
  assert.deepEqual(await values(),{binInput:'-111011',octInput:'-73',decInput:'-59',hexInput:'-3B',customInput:'-59',signMagInput:'10111011',onesInput:'11000100',twosInput:'11000101'});
  assert.equal(await text('infoUnsigned'),'197');
  await page.locator('#signMagInput').fill('10000000');assert.equal((await values()).decInput,'0');
  await page.locator('#onesInput').fill('11111111');assert.equal((await values()).decInput,'0');
  await page.locator('#calcBtn').click();assert.equal((await values()).onesInput,'00000000');
});

test('exact arithmetic across UI input paths and widths 1–128',async()=>{
  const result=await page.evaluate(()=>{
    const fields=['binInput','octInput','decInput','hexInput','customInput','signMagInput','onesInput','twosInput'];
    let cases=0,comparisons=0;const failures=[];
    function set(id,value,event='input'){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event(event,{bubbles:true}));}
    function check(v,w){
      const full=2n**BigInt(w),half=full/2n,m=v<0n?-v:v,u=v<0n?full+v:v;
      const bits=m.toString(2).padStart(w,'0');
      const expected=[v.toString(2),v.toString(8),v.toString(),v.toString(16).toUpperCase(),v.toString(),m<half?(v<0n?'1':'0')+bits.slice(1):null,m<half?(v<0n?bits.replace(/[01]/g,c=>c==='0'?'1':'0'):bits):null,u.toString(2).padStart(w,'0')];
      for(let s=0;s<fields.length;s++){
        if(expected[s]===null)continue;
        set(fields[s],expected[s]);cases++;
        for(let i=0;i<fields.length;i++){
          comparisons++;const actual=document.getElementById(fields[i]).value.replace(/\s/g,'');
          if(actual!==(expected[i]??'')&&failures.length<10)failures.push({w,v:v.toString(),source:fields[s],target:fields[i],actual,expected:expected[i]});
        }
        comparisons++;if(document.getElementById('infoUnsigned').textContent!==u.toString()&&failures.length<10)failures.push({w,v:v.toString(),target:'infoUnsigned'});
      }
    }
    for(let w=1;w<=128;w++){
      set('bitWidth','custom','change');set('customBitWidth',String(w));
      const half=2n**BigInt(w-1);
      for(const v of new Set([-half,-half+1n,-1n,0n,half-1n]))check(v,w);
    }
    set('bitWidth','8','change');for(let v=-128n;v<128n;v++)check(v,8);
    return{cases,comparisons,failures};
  });
  assert.deepEqual(result.failures,[]);console.log(JSON.stringify(result));
  if(artifacts)fs.writeFileSync(path.join(artifacts,'ui-math-results.json'),JSON.stringify(result,null,2));
});

test('large integers, minimum values and unavailable encodings are accurate',async()=>{
  await width(32);await page.locator('#decInput').fill('-1');assert.equal(await text('infoUnsigned'),'4294967295');
  await width(64);await page.locator('#decInput').fill('9007199254740993');assert.equal((await values()).hexInput,'20000000000001');
  await page.locator('#twosInput').fill('1'.repeat(64));assert.equal((await values()).decInput,'-1');
  await width(128);await page.locator('#decInput').fill((-(2n**127n)).toString());
  const actual=await values();assert.equal(actual.twosInput,'1'+'0'.repeat(127));assert.equal(actual.onesInput,'');
  assert.equal(await page.locator('#onesInput').getAttribute('placeholder'),'Not representable');
  assert.match(await text('onesInputFeedback'),/128 bits/);
  assert.equal(await page.locator('[data-copy="onesInput"]').isDisabled(),true);
  assert.equal(await text('infoRange'),'[-170141183460469231731687303715884105728, 170141183460469231731687303715884105727]');
});

test('overflow stays visible; Calculate never substitutes an old result',async()=>{
  await page.locator('#decInput').fill('128');await page.locator('#calcBtn').click();
  assert.equal((await values()).decInput,'128');assert.equal((await values()).hexInput,'');assert.equal(await text('infoVal'),'—');
  assert.match(await text('decInputFeedback'),/-128 to 127/);
  await page.locator('#decInput').fill('42');await page.locator('#hexInput').fill('GG');await page.locator('#calcBtn').click();
  assert.equal((await values()).hexInput,'GG');assert.equal((await values()).decInput,'');assert.equal(await page.locator('#hexInput').getAttribute('aria-invalid'),'true');
  await page.locator('#customInput').fill('-');assert.equal((await values()).customInput,'-');assert.equal((await values()).decInput,'');
  await page.locator('#calcBtn').click();assert.match(await text('customInputFeedback'),/at least one digit/);
  await page.locator('#customInput').fill('-59');assert.equal((await values()).decInput,'-59');
});

test('width and radix changes preserve the number and validate boundaries',async()=>{
  await width(16);await page.locator('#decInput').fill('1000');await width(8);
  assert.equal((await values()).decInput,'1000');assert.equal((await values()).twosInput,'');assert.match(await text('decInputFeedback'),/Outside/);
  await width(16);assert.equal((await values()).twosInput,'0000001111101000');
  await width(8);await page.locator('#twosInput').fill('11000101');await width(16);
  assert.equal((await values()).decInput,'-59');assert.equal((await values()).twosInput,'1111111111000101');
  await page.locator('#customBase').fill('8');await page.locator('#customInput').fill('17');await page.locator('#customBase').fill('16');
  assert.equal((await values()).decInput,'15');assert.equal((await values()).customInput,'f');
  await width(129);assert.match(await text('errorMsg'),/1 to 128/);assert.equal(await text('infoRange'),'—');
  await page.locator('#decInput').fill('1');assert.equal((await values()).twosInput,'');
  await width(128);assert.equal((await values()).twosInput,'0'.repeat(127)+'1');
  await page.locator('#customBitWidth').fill('0');assert.equal(await text('infoRange'),'—');
  await page.locator('#customBitWidth').fill('1.5');assert.equal(await text('infoRange'),'—');
  await width(8);await page.locator('#customBase').fill('37');assert.match(await text('errorMsg'),/2 to 36/);
  await page.locator('#customBase').fill('10');assert.equal((await values()).decInput,'1');
});

test('pasting prefixes and Unicode minus, editing in place, clear and reset',async()=>{
  await width(16);
  for(const [id,raw] of [['hexInput','−0x 3B'],['binInput','−0b11\n1011'],['octInput','−0o73']]){
    await page.locator('#'+id).fill(raw);assert.equal((await values()).decInput,'-59');
  }
  await page.locator('#decInput').fill('1234');await page.locator('#decInput').press('Home');await page.locator('#decInput').press('ArrowRight');await page.keyboard.type('9');
  assert.equal(await page.locator('#decInput').inputValue(),'19234');assert.equal(await page.locator('#decInput').evaluate(e=>e.selectionStart),2);
  await page.locator('#decInput').fill('');assert(Object.values(await values()).every(v=>v===''));assert.equal(await text('infoVal'),'—');
  await width(32);assert.equal(await page.locator('#bitWidth').inputValue(),'32');assert.equal(await text('infoRange'),'[-2147483648, 2147483647]');
  await page.locator('#hexInput').fill('GG');await page.locator('#resetBtn').click();
  assert(Object.values(await values()).every(v=>v===''));assert.equal(await text('hexInputFeedback'),'');assert.equal(await text('infoVal'),'—');
});

test('all custom bases work through the live UI',async()=>{
  await width(128);
  for(let base=2;base<=36;base++){
    await page.locator('#customBase').fill(String(base));
    for(const n of [-9007199254740993n,0n,9007199254740993n]){
      await page.locator('#customInput').fill(n.toString(base));assert.equal((await values()).decInput,n.toString());
    }
  }
});

test('copy produces exact ungrouped values and keeps leading bits',async()=>{
  await page.locator('#decInput').fill('-59');
  for(const [id,expected] of [['binInput','-111011'],['twosInput','11000101'],['decInput','-59']]){
    await page.locator('[data-copy="'+id+'"]').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),expected);
  }
  await page.locator('#decInput').fill('1');await page.locator('[data-copy="twosInput"]').click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'00000001');
});

test('clipboard fallback reports real success or failure',async()=>{
  await page.locator('#decInput').fill('-59');
  await page.evaluate(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('unavailable'));document.execCommand=command=>{window.fallbackValue=document.activeElement.value;return command==='copy';};});
  await page.locator('[data-copy="twosInput"]').click();assert.equal(await page.evaluate(()=>window.fallbackValue),'11000101');
  assert.match(await text('announcement'),/copied/);
  await page.evaluate(()=>{document.execCommand=()=>false;});await page.locator('[data-copy="decInput"]').click();
  assert.match(await text('announcement'),/Unable to copy/);
});

test('labels, translations, help controls and no saved preferences',async()=>{
  const missing=await page.locator('input,select,textarea').evaluateAll(es=>es.filter(e=>!e.labels.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.id));
  assert.deepEqual(missing,[]);
  await page.locator('label[for="decInput"]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'decInput');
  await page.locator('[data-about="onesInput"]').click();assert.equal(await page.locator('.explanation[open]').count(),1);assert.match(await page.locator('.explanation[open] .help').textContent(),/invert every bit/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.explanation[open]').count(),0);
  await page.locator('[data-lang="zh"]').click();assert.equal(await page.locator('html').getAttribute('lang'),'zh');assert.equal(await text('numberHeading'),'数值');
  await page.locator('[data-lang="fr"]').click();assert.equal(await page.locator('html').getAttribute('lang'),'fr');assert.equal(await text('numberHeading'),'Nombre');
  await width(64);await page.locator('#customBase').fill('16');await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('#bitWidth').inputValue(),'8');assert.equal(await page.locator('#customBase').inputValue(),'10');
  assert.equal(await page.evaluate(()=>localStorage.length),0);
});

test('six screen sizes: no page overflow, no clipped results, and reachable header',async()=>{
  const results=[];
  for(const [name,w,h] of [['small-phone',320,568],['phone',390,844],['landscape',844,390],['tablet',768,1024],['desktop',1440,900],['ultrawide',2560,1080]]){
    await page.setViewportSize({width:w,height:h});await width(8);await page.locator('#decInput').fill('-59');await page.locator('#decInput').blur();
    if(artifacts)await page.screenshot({path:path.join(artifacts,name+'-8bit.png'),fullPage:true});
    await width(128);await page.locator('#decInput').fill((2n**127n-1n).toString());await page.locator('#decInput').blur();
    for(const lang of ['en','zh','fr']){
      await page.locator('[data-lang="'+lang+'"]').click();
      const layout=await page.evaluate(()=>{window.scrollTo(0,0);return{viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,headerTop:document.querySelector('header').getBoundingClientRect().top,clipped:[...document.querySelectorAll('textarea')].filter(e=>e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1).map(e=>({id:e.id,clientHeight:e.clientHeight,scrollHeight:e.scrollHeight}))};});
      assert(layout.pageWidth<=w,JSON.stringify({name,lang,layout}));assert(layout.headerTop>=0);assert.deepEqual(layout.clipped,[],JSON.stringify({name,lang,layout}));
      results.push({name,lang,...layout});
      if(lang==='en'&&artifacts)await page.screenshot({path:path.join(artifacts,name+'-128bit.png'),fullPage:true});
    }
    await page.locator('[data-lang="en"]').click();
  }
  if(artifacts)fs.writeFileSync(path.join(artifacts,'layout-results.json'),JSON.stringify(results,null,2));
});

test('touch-sized controls and help fit a narrow phone',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const touchContext=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const touch=await touchContext.newPage();
  try {
    await touch.goto(origin);
    if(process.env.TEST_THEME==='dark')await touch.locator('#themeToggle').click();
    await touch.locator('#bitWidth').selectOption('custom');await touch.locator('#customBitWidth').fill('128');
    await touch.locator('#decInput').fill((-(2n**127n)).toString());await touch.locator('[data-lang="fr"]').click();
    await touch.locator('[data-about="signMagInput"]').click();
    const metrics=await touch.evaluate(()=>({width:innerWidth,pageWidth:document.documentElement.scrollWidth,font:getComputedStyle(document.getElementById('decInput')).fontSize,help:document.querySelector('.explanation[open] .help').getBoundingClientRect().toJSON(),clipped:[...document.querySelectorAll('textarea')].filter(e=>e.scrollHeight>e.clientHeight+1).map(e=>e.id)}));
    assert.equal(metrics.font,'16px');assert(metrics.pageWidth<=metrics.width);assert(metrics.help.left>=0&&metrics.help.right<=metrics.width);assert.deepEqual(metrics.clipped,[]);
    if(artifacts)await touch.screenshot({path:path.join(artifacts,'touch-phone-fr-help.png'),fullPage:true});
  } finally {await touchContext.close();}
});

test('standalone HTML works without a server or network',async()=>{
  await context.setOffline(true);
  await page.goto(require('node:url').pathToFileURL(path.join(__dirname,'..','index.html')).href);
  await width(128);await page.locator('#decInput').fill('9007199254740993');
  assert.equal((await values()).hexInput,'20000000000001');
  await page.locator('#twosInput').fill('1'.repeat(128));assert.equal((await values()).decInput,'-1');
});
