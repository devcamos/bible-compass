import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { IDBFactory } from "fake-indexeddb";
import { CONCEPT_SLUGS } from "../src/content/concepts";
import { lifeAreas, entryPaths } from "../src/content/home";
import { GIFTS, GIFTS_FOR_SERVING, GIFTS_MINISTRY_ROLES, GIFTS_READING_PAGES, GIFTS_FOUNDATIONS, getGift, getGiftsFoundation, giftUrl, giftReferenceUrl, giftChapterUrl } from "../src/content/gifts";
import GiftPage, { generateStaticParams as giftParams, generateMetadata as giftMetadata } from "../src/app/gifts/spiritual-gifts/[gift]/page";
import GiftsFoundationPage, { generateStaticParams as foundationParams, generateMetadata as foundationMetadata } from "../src/app/gifts/[section]/page";
import { SAVED_PAGE_CATALOG } from "../src/lib/saved-page-catalog";
import { openSavedPages, mutateSavedPage, readSavedPages } from "../src/lib/saved-pages";
import sitemap from "../src/app/sitemap";

// Agreed Scripture membership, independently of the content filters/rendering.
const named = {
  wisdom:["1 Corinthians",12,8,"the message of wisdom"], knowledge:["1 Corinthians",12,8,"the message of knowledge"],
  faith:["1 Corinthians",12,9,"faith"], healing:["1 Corinthians",12,9,"gifts of healing"],
  miracles:["1 Corinthians",12,10,"the working of miracles"], prophecy:["1 Corinthians",12,10,"prophecy"],
  discernment:["1 Corinthians",12,10,"distinguishing between spirits"], tongues:["1 Corinthians",12,10,"speaking in various tongues"],
  interpretation:["1 Corinthians",12,10,"the interpretation of tongues"], serving:["Romans",12,7,"serving"],
  teaching:["Romans",12,7,"teaching"], encouragement:["Romans",12,8,"encouraging"], giving:["Romans",12,8,"giving"],
  leadership:["Romans",12,8,"leading"], mercy:["Romans",12,8,"showing mercy"],
  helping:["1 Corinthians",12,28,"helping"], administration:["1 Corinthians",12,28,"administration"],
  apostles:["Ephesians",4,11,"apostles"], prophets:["Ephesians",4,11,"prophets"], evangelists:["Ephesians",4,11,"evangelists"],
  pastors:["Ephesians",4,11,"pastors"], teachers:["Ephesians",4,11,"teachers"],
} as const;
const ids=Object.keys(named);
const foundations=["grace","holy-spirit","fruit"];
const paths=["/gifts","/gifts/spiritual-gifts",...foundations.map(id=>`/gifts/${id}`),...ids.map(id=>`/gifts/spiritual-gifts/${id}`)];
const source=JSON.parse(readFileSync(new URL("./fixtures/gifts-bsb.json",import.meta.url),"utf8"));

test("all selected gifts are individual; equipping roles and overlapping teaching/prophecy stay distinct",()=>{
  assert.deepEqual(GIFTS.map(g=>g.id).sort(),ids.toSorted());
  assert.deepEqual(GIFTS_FOR_SERVING.map(g=>g.id),ids.slice(0,17));
  assert.deepEqual(GIFTS_MINISTRY_ROLES.map(g=>g.id),["apostles","prophets","evangelists","pastors","teachers"]);
  assert.equal(new Set(GIFTS.map(g=>g.id)).size,22);
  assert.equal(getGift("prophecy")?.kind,"gift");assert.equal(getGift("prophets")?.kind,"role");
  assert.equal(getGift("teaching")?.kind,"gift");assert.equal(getGift("teachers")?.kind,"role");
  assert.deepEqual(GIFTS_FOUNDATIONS.map(s=>s.id),foundations);
});

test("quotations match independently retrieved BSB verses and highlight exactly the gift named in that verse",()=>{
  for(const id of ids){
    const gift=getGift(id)!;const quote=gift.namingScripture;
    const [book,chapter,verse,phrase]=named[id as keyof typeof named];
    assert.deepEqual([quote.ref.book,quote.ref.chapter,quote.ref.verse,quote.highlight],[book,chapter,verse,phrase],id);
    const expected=source.verses.find((v:{ref:{book:string;chapter:number;verse:number}})=>v.ref.book===book&&v.ref.chapter===chapter&&v.ref.verse===verse);
    assert.ok(expected,id);assert.equal(quote.text,expected.text,id);assert.equal(quote.text.split(phrase).length,2,id);
    assert.equal(giftReferenceUrl(quote.ref),expected.source);
    assert.equal(giftChapterUrl(quote.ref),expected.source.split("#")[0]);
    if(gift.kind==="role") assert.equal(quote.ref.label,"Ephesians 4:11");
  }
});

test("every entry has a plain meaning, context, illustration, reflection and only published related concepts",()=>{
  for(const gift of GIFTS){
    for(const text of [gift.meaning,gift.context,gift.example,gift.step]) assert.ok(text.trim().length>=30,gift.id);
    assert.ok(gift.refs.length>0&&gift.overviewRefs.length>0,gift.id);
    for(const ref of [...gift.refs,...gift.overviewRefs]){
      assert.ok(ref.book&&ref.label&&Number.isInteger(ref.chapter)&&ref.chapter>0&&Number.isInteger(ref.verse)&&ref.verse>0,gift.id);
      assert.match(giftReferenceUrl(ref),/^https:\/\/biblehub\.com\/bsb\/[a-z0-9_]+\/\d+\.htm#\d+$/);
    }
    for(const [slug,title] of gift.related){assert.ok(CONCEPT_SLUGS.includes(slug),`${gift.id}: ${slug}`);assert.ok(title);}
  }
  for(const section of GIFTS_FOUNDATIONS){assert.ok(section.body&&section.refs?.length);for(const [slug] of section.related??[]) assert.ok(CONCEPT_SLUGS.includes(slug));}
  assert.match(getGift("healing")!.meaning,/without promising a particular outcome/);
  assert.match(getGift("discernment")!.meaning,/Distinguishing between spirits/);
  assert.match(getGift("prophecy")!.meaning,/weigh what is said/);
  assert.deepEqual(getGift("tongues")!.overviewRefs.map(ref=>ref.label),["1 Corinthians 12:10","1 Corinthians 14:2","1 Corinthians 14:27–28"]);
  assert.deepEqual(getGift("interpretation")!.overviewRefs.map(ref=>ref.label),["1 Corinthians 12:10","1 Corinthians 14:5","1 Corinthians 14:13"]);
});

test("only canonical static routes resolve; unknown lookups and server resources produce 404",async()=>{
  assert.deepEqual(giftParams(),ids.map(gift=>({gift})));
  assert.deepEqual(foundationParams(),foundations.map(section=>({section})));
  for(const id of ids){
    assert.ok(await GiftPage({params:Promise.resolve({gift:id})}));
    assert.equal((await giftMetadata({params:Promise.resolve({gift:id})})).alternates?.canonical,giftUrl(id));
  }
  for(const section of foundations){
    assert.ok(await GiftsFoundationPage({params:Promise.resolve({section})}));
    assert.equal((await foundationMetadata({params:Promise.resolve({section})})).alternates?.canonical,`/gifts/${section}`);
  }
  const missing={digest:"NEXT_HTTP_ERROR_FALLBACK;404"};
  for(const invalid of ["missing","","Healing","__proto__","healing/extra"]){
    assert.equal(getGift(invalid),undefined);assert.equal(getGiftsFoundation(invalid),undefined);
    await assert.rejects(GiftPage({params:Promise.resolve({gift:invalid})}),missing);
    await assert.rejects(GiftsFoundationPage({params:Promise.resolve({section:invalid})}),missing);
  }
  assert.equal((await giftMetadata({params:Promise.resolve({gift:"missing"})})).alternates,undefined);
  assert.equal((await foundationMetadata({params:Promise.resolve({section:"missing"})})).alternates,undefined);
});

test("discernment offers the five requested everyday contexts with linked wisdom and reflective questions",()=>{
  const insights=getGift("discernment")!.everydayInsights;
  assert.ok(insights);
  assert.deepEqual(insights.contexts.map(({id,title})=>[id,title]),[
    ["friends","Friends"],["family","Family"],["relationships","Relationships"],["work","Work"],["business","Business"],
  ]);
  assert.match(insights.introduction,/testing of spiritual claims alongside biblical wisdom/);
  assert.match(insights.introduction,/not additional definitions of the gift/);
  assert.match(insights.closing,/Feelings can prompt a question; they do not prove a conclusion/);
  assert.equal(insights.questions.length,5);
  assert.ok(insights.questions.some(question=>question.includes("what am I assuming")));
  const expectedReferences=[
    ["Proverbs 13:20","Proverbs 27:6"],["James 1:19–20","Proverbs 18:17"],
    ["1 Corinthians 13:4–7","James 3:17"],["Proverbs 18:13","James 3:17"],["Proverbs 11:1","Proverbs 15:22"],
  ];
  assert.deepEqual(insights.contexts.map(context=>context.references.map(ref=>ref.label)),expectedReferences);
  assert.deepEqual(insights.references.map(ref=>ref.label),["1 Thessalonians 5:19–22","Hebrews 5:14"]);
  for(const context of insights.contexts){
    assert.ok(context.situation.length>50&&context.insight.length>80&&context.response.length>80);
    for(const ref of context.references)assert.match(giftReferenceUrl(ref),/^https:\/\/biblehub\.com\/bsb\/[a-z0-9_]+\/\d+\.htm#\d+$/);
  }
  assert.ok(GIFTS.filter(gift=>gift.id!=="discernment").every(gift=>gift.everydayInsights===undefined));
});

test("home adds a single collapsed Foundations destination while preserving all existing compass choices",()=>{
  assert.equal(lifeAreas.length,8);
  const foundationsArea=lifeAreas.find(a=>a.id==="foundations")!;
  assert.ok(!foundationsArea.defaultOpen);
  assert.deepEqual(foundationsArea.topicSlugs,["jesus-and-the-gospel","components-of-the-bible","how-to-read-the-bible","bible-timeline","books-described"]);
  assert.deepEqual(foundationsArea.links?.map(l=>l.href),["/proverbs","/psalms","/revelation","/gifts"]);
  assert.equal(lifeAreas.flatMap(a=>a.links??[]).filter(l=>l.href==="/gifts").length,1);
  assert.deepEqual(entryPaths.map(p=>p.href),["/topics/peace","/topics/courage","/topics/faith","/topics/how-to-read-the-bible"]);
});

test("27 canonical readings enter the saved catalog and production sitemap exactly once",()=>{
  assert.deepEqual(GIFTS_READING_PAGES.map(p=>p.path).sort(),paths.toSorted());
  const saved=SAVED_PAGE_CATALOG.filter(p=>p.path==="/gifts"||p.path.startsWith("/gifts/"));
  assert.deepEqual(saved.map(p=>p.path).sort(),paths.toSorted());
  assert.equal(new Set(SAVED_PAGE_CATALOG.map(p=>p.path)).size,SAVED_PAGE_CATALOG.length);
  for(const path of paths) assert.equal(sitemap().filter(p=>new URL(p.url).pathname===path).length,1,path);
});

test("new gifts use the existing local saved-page store without losing old readings or accepting unknown URLs",async t=>{
  const db=await openSavedPages(new IDBFactory());t.after(()=>db.close());
  const allowed=new Set(SAVED_PAGE_CATALOG.map(p=>p.path));
  const prior=new Set([...allowed].filter(p=>!p.startsWith("/gifts")));
  const old=["/topics/jesus-and-the-gospel","/revelation","/proverbs","/psalms"];
  for(const path of old) await mutateSavedPage(db,prior,{type:"save",path});
  await mutateSavedPage(db,allowed,{type:"save",path:"/gifts/spiritual-gifts/discernment"});
  assert.deepEqual(new Set((await readSavedPages(db,allowed)).map(p=>p.path)),new Set([...old,"/gifts/spiritual-gifts/discernment"]));
  for(const path of ["/gifts/missing","/gifts/spiritual-gifts/missing","/gifts/spiritual-gifts/healing?source=mail","/gifts/spiritual-gifts#gift-healing","https://biblehub.com/bsb/1_corinthians/12.htm#9"]){
    await assert.rejects(mutateSavedPage(db,allowed,{type:"save",path}),/cannot be saved/);
  }
  assert.equal(db.version,1);assert.deepEqual(Array.from(db.objectStoreNames),["pages"]);
});
