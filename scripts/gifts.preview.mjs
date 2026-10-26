// Actual immutable Git Preview only. No local server or Production writes.
// node scripts/gifts.preview.mjs /private/config.json /private/report.json
// mode0600 config: {origin, shareUrl, commit}; revoke owned QA access afterwards.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, expect as baseExpect } from "@playwright/test";
import { redactPreviewError } from "./preview-error.mjs";

const expect=baseExpect.configure({timeout:15_000});
const file=process.argv[2], output=process.argv[3];
assert.equal(fs.statSync(file).mode&0o777,0o600);
const cfg=JSON.parse(fs.readFileSync(file,"utf8"));
const origin=new URL(cfg.origin);
assert.equal(origin.origin,cfg.origin);assert.equal(origin.protocol,"https:");
assert.ok(origin.hostname.endsWith(".vercel.app")&&!origin.hostname.includes("-git-"));
assert.equal(new URL(cfg.shareUrl).origin,cfg.origin);assert.match(cfg.commit,/^[a-f0-9]{40}$/);
const content=JSON.parse(fs.readFileSync(new URL("../src/content/gifts-data.json",import.meta.url),"utf8"));
const source=JSON.parse(fs.readFileSync(new URL("./fixtures/gifts-bsb.json",import.meta.url),"utf8"));
const result={type:"Actual Gifts app Git Preview",commit:cfg.commit,result:"running",checks:[],errors:[],apiWrites:0,permissions:0,subscriptions:0,contrast:[],startedAt:new Date().toISOString(),limits:["Synthetic Chromium; no physical-device or screen-reader certification.","Scripture URLs inspected; external Scripture provider availability not exercised.","Preview-local IndexedDB only; no Production data or notifications."]};
const check=(label,ok=true)=>{assert.ok(ok,label);result.checks.push(label);};
const external=ref=>`https://biblehub.com/bsb/${ref.book.toLowerCase().replaceAll(" ","_")}/${ref.chapter}.htm`;
const safe=e=>redactPreviewError(e,cfg.shareUrl);
function luminance(color){return color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
let browser;
try{
 const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
 browser=await chromium.launch({executablePath:process.env.GIFTS_CHROMIUM_EXECUTABLE||"/usr/bin/chromium",headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--disable-background-networking"],...(proxy?{proxy:{server:proxy}}:{})});
 for(const [width,theme] of [[390,"light"],[320,"dark"],[1280,"light"]]){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme});
  context.setDefaultTimeout(15_000);
  context.on("page",page=>page.on("pageerror",e=>result.errors.push(safe(e))));
  await context.route(/^https?:/,route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==cfg.origin){
    // Vercel injects its real Preview toolbar. Blocking that script triggers
    // the reader's legitimate resource-failure recovery screen.
    if(url.origin==="https://vercel.live"&&["GET","HEAD","OPTIONS"].includes(request.method()))return route.continue();
    return route.abort();
   }
   if(url.pathname.startsWith("/api/")&&!["GET","HEAD","OPTIONS"].includes(request.method())){result.apiWrites++;return route.abort();}
   return route.continue();
  });
  await context.exposeFunction("__giftsPermission",()=>{result.permissions++;});
  await context.exposeFunction("__giftsSubscription",()=>{result.subscriptions++;});
  await context.addInitScript(({origin,theme})=>{
   if(location.origin!==origin)return;
   localStorage.setItem("bible-compass-theme",theme);
   sessionStorage.setItem("bible-compass-splash-seen","1");
   if("Notification"in window)Notification.requestPermission=async()=>{await window.__giftsPermission();return"denied";};
   if("PushManager"in window)PushManager.prototype.subscribe=async()=>{await window.__giftsSubscription();throw Error("QA blocks push subscriptions");};
  },{origin:cfg.origin,theme});
  const page=await context.newPage();
  const auth=await page.goto(cfg.shareUrl,{waitUntil:"domcontentloaded"});assert.equal(auth.status(),200);
  const health=await(await context.request.get(cfg.origin+"/health")).json();
  check(width+": exact Preview health",health.commit===cfg.commit&&health.surface==="preview");
  async function visit(url,title){const response=await page.goto(cfg.origin+url,{waitUntil:"domcontentloaded"});assert.equal(response.status(),200,url);await expect(page.locator("main h1")).toHaveText(title);}
  await page.goto(cfg.origin+"/",{waitUntil:"domcontentloaded"});
  result.phase=width+": closed Foundations entry";
  const entry=page.locator('main a[href="/gifts"]');
  const disclosure=entry.locator("xpath=ancestor::details");
  await expect(disclosure).not.toHaveAttribute("open","");
  await disclosure.locator("summary").click();await entry.click();
  await expect(page.locator("main h1")).toHaveText("Gifts from God");
  result.phase=width+": Gifts introduction";
  const intro=page.locator("main details");await expect(intro).not.toHaveAttribute("open","");
  await intro.locator("summary").focus();await page.keyboard.press("Enter");await expect(intro).toHaveAttribute("open","");
  check(width+": compact Foundations entry and keyboard introduction");
  for(const section of content.sections.filter(s=>s.id!=="spiritual-gifts")){
   result.phase=width+": foundation "+section.id;
   await visit("/gifts/"+section.id,section.title);await expect(page.getByText(section.body,{exact:true})).toBeVisible();
   for(const ref of section.refs)assert.ok(await page.locator(`main a[href="${external(ref)}#${ref.verse}"]`).count());
   check(width+": "+section.id+" reading and Scripture links");
  }
  result.phase=width+": plain-description list";
  await visit("/gifts/spiritual-gifts","Gifts for serving");
  await expect(page.getByRole("table")).toHaveCount(1);
  await expect(page.locator("[data-gift]")).toHaveCount(17);await expect(page.locator("[data-role]")).toHaveCount(5);
  for(const gift of content.gifts){
   result.phase=width+": description "+gift.id;
   const row=page.locator(gift.kind==="role"?`[data-role="${gift.id}"]`:`[data-gift="${gift.id}"]`);
   await expect(row.getByRole("link",{name:gift.title,exact:true})).toBeVisible();
   if(gift.kind==="gift")await expect(row.locator("td").first()).toHaveText(gift.meaning);
   else await expect(row).toContainText(gift.meaning);
   if(gift.kind==="gift")for(const ref of gift.overviewRefs)assert.ok(await row.locator(`a[href="${external(ref)}#${ref.verse}"]`).count(),gift.id);
  }
  check(width+": all approved plain descriptions, main references and separate ministry roles visible");
  const scriptureActions=page.locator('main a.bc-gifts-reference');
  for(const link of await scriptureActions.all())await expect(link.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  check(width+": Scripture actions use the existing SVG external-link icon");
  check(width+": list has no overflow",await page.locator("html").evaluate(el=>el.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(path.dirname(output),`gifts-list-${width}-${theme}.png`),fullPage:true});
  for(const gift of content.gifts){
   result.phase=width+": individual "+gift.id;
   await page.locator(`#gift-${gift.id}`).click();await expect(page.locator("main h1")).toHaveText(gift.title);
   const q=page.locator("[data-naming-scripture]");
   const ref=gift.namingScripture.ref;
   const original=source.verses.find(v=>v.ref.book===ref.book&&v.ref.chapter===ref.chapter&&v.ref.verse===ref.verse);assert.ok(original,gift.id);
   await expect(q.locator("blockquote p")).toHaveText(original.text);await expect(q.locator("mark")).toHaveText(gift.namingScripture.highlight);
   await expect(q.locator("blockquote")).toHaveAttribute("cite",original.source);
   await expect(q.locator("+ section h2")).toHaveText("What it means");await expect(q.locator("+ section p")).toHaveText(gift.meaning);
   assert.ok(await q.locator(`a[href="${external(ref)}"]`).count());
   const canonical=await page.locator('link[rel="canonical"]').getAttribute("href");assert.equal(new URL(canonical).pathname,`/gifts/spiritual-gifts/${gift.id}`);
   check(width+": "+gift.id+" real route, verified BSB, highlighted naming words and approved explanation");
   check(width+": "+gift.id+" no overflow",await page.locator("html").evaluate(el=>el.scrollWidth<=innerWidth));
   if(["healing","discernment"].includes(gift.id)){
    await page.screenshot({path:path.join(path.dirname(output),`gifts-${gift.id}-${width}-${theme}.png`),fullPage:true});
    for(const element of [q.locator("mark"),q.locator("a").first(),page.locator("main .bc-kicker")]){
     const css=await element.evaluate(el=>{let parent=el;while(parent&&getComputedStyle(parent).backgroundColor==="rgba(0, 0, 0, 0)")parent=parent.parentElement;return{color:getComputedStyle(el).color,bg:getComputedStyle(parent||document.body).backgroundColor};});
     const ratio=contrast(css.color,css.bg);result.contrast.push({width,theme,gift:gift.id,ratio});assert.ok(ratio>=4.5,"Reading contrast");
    }
   }
   await page.getByRole("link",{name:"← All gifts for serving",exact:true}).click();
   await expect(page.locator(`#gift-${gift.id}`)).toBeFocused();
  }
  check(width+": all return links focus the correct named gift");
  for(const url of ["/gifts/missing","/gifts/spiritual-gifts/missing","/gifts/spiritual-gifts/Healing","/gifts/grace/extra"]){assert.equal((await context.request.get(cfg.origin+url)).status(),404,url);}
  check(width+": unknown routes are real HTTP404");
  if(width===390){
   result.phase="Save/Profile/reload/Remove/Undo/reopen";
   await visit("/revelation","Faithful hope in Christ");await page.getByRole("button",{name:"Save page",exact:true}).click();await expect(page.getByRole("button",{name:"Saved",exact:true})).toBeEnabled();
   await visit("/gifts/spiritual-gifts/discernment","Discernment");await page.getByRole("button",{name:"Save page",exact:true}).click();await expect(page.getByRole("button",{name:"Saved",exact:true})).toBeEnabled();
   await page.reload({waitUntil:"domcontentloaded"});await expect(page.getByRole("button",{name:"Saved",exact:true})).toBeEnabled();
   await page.getByRole("button",{name:"Open profile",exact:true}).click();await page.getByRole("link",{name:/Saved pages/}).click();
   await expect(page.locator('[data-reading="/revelation"]')).toBeVisible();await expect(page.locator('[data-reading="/gifts/spiritual-gifts/discernment"]')).toBeVisible();
   await page.getByRole("button",{name:"Remove Discernment",exact:true}).click();await page.getByRole("button",{name:/^Undo/}).click();
   await expect(page.locator('[data-reading="/gifts/spiritual-gifts/discernment"]')).toBeVisible();
   await page.locator('[data-reading="/gifts/spiritual-gifts/discernment"]').click();await expect(page.locator("main h1")).toHaveText("Discernment");
   check("Existing Save/Profile/reload/Remove/Undo/reopen works for new Gifts and old Revelation readings");
  }
  for(const url of ["/proverbs","/psalms","/revelation","/feedback"]){assert.equal((await context.request.get(cfg.origin+url)).status(),200,url);}
  check(width+": existing reading and feedback paths preserved");
  await context.close();
 }
 result.phase="JavaScript-disabled reader";
 const plain=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
 await plain.request.get(cfg.shareUrl);
 const page=await plain.newPage();assert.equal((await page.goto(cfg.origin+"/gifts/spiritual-gifts")).status(),200);
 await expect(page.locator("[data-gift]")).toHaveCount(17);await expect(page.locator("[data-role]")).toHaveCount(5);
 check("Descriptions and references are server rendered and readable with JavaScript disabled");await plain.close();
 check("No script errors",result.errors.length===0);check("No app API writes or notification permissions/subscriptions",result.apiWrites+result.permissions+result.subscriptions===0);
 result.result="passed";result.phase="complete";
}catch(error){result.result="failed";result.failure=safe(error);process.exitCode=1;}
finally{await browser?.close();result.completedAt=new Date().toISOString();fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify({result:result.result,checks:result.checks.length,errors:result.errors,apiWrites:result.apiWrites,permissions:result.permissions,subscriptions:result.subscriptions,failure:result.failure}));}
