import fs from 'node:fs/promises';
const candidates=JSON.parse(await fs.readFile('scripts/career-candidates.json','utf8'));
const checked=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const verified=[]; const review=[];
for(let start=0;start<candidates.length;start+=6) {
  await Promise.all(candidates.slice(start,start+6).map(async ([name,category,sector,url])=> {
    try {
      let response=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'OfferFit-career-directory-research/1.0'}});
      let html=await response.text(); let title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
      if(!response.ok || /not found|404|access denied|just a moment|captcha|attention required/i.test(title) || !/careers|jobs|join us|work with us|opportunities/i.test(html)) throw new Error(`Unverified response ${response.status}: ${title.slice(0,100)}`);
      const careerDestination=value=> /career|jobs|work-with|journey|hiring|opportunities|lifeat|live-your-dream/i.test(value);
      if (!careerDestination(response.url)) {
        const next=[...html.matchAll(/href=["']([^"']+)["']/g)].map(m=>m[1].replace(/&amp;/g,'&')).find(h=>/career|\/jobs/i.test(h)&&!h.startsWith('#'));
        if(!next) throw new Error('Redirected to a generic page without a verified careers destination');
        const destination=new URL(next,response.url); if(destination.protocol!=='https:') throw new Error('Unsupported career destination');
        response=await fetch(destination,{signal:AbortSignal.timeout(15000)});html=await response.text();title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'';
        if(!response.ok||!careerDestination(response.url)||/not found|404|access denied|just a moment/i.test(title)) throw new Error('Linked career destination could not be verified');
      }
      verified.push({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,category,sector,careers_url:response.url,source_url:url,checked_at:checked,verification:'Official careers destination reachable',hiring_note:category==='Mid-size / remote'?'Remote and India eligibility vary by role':'Check current roles and 0-YOE eligibility',yc_batch:null,funding_date:name==='Sarvam AI'?'2026-06-15':null,funding_source:name==='Sarvam AI'?'https://www.sarvam.ai/announcing-series-b':null,location:'Check role listing',website:new URL(url).origin,company_status:'Not assessed'});
    } catch(error) { review.push({name,url,error:error.message}); }
  }));
  console.log(`Careers checked ${Math.min(start+6,candidates.length)}/${candidates.length}; reachable ${verified.length}`);
}
const yc=JSON.parse(await fs.readFile('frontend/data/yc-companies.json','utf8'));
const key=c=> { try { const hostname=new URL(c.website).hostname.replace(/^www\./,'').replace(/^(jobs|careers|career|research)\./,''); return hostname; } catch { return c.name.toLowerCase().replace(/[^a-z0-9]/g,''); } };
const merged=new Map(verified.map(c=>[key(c),c]));
for(const c of yc) { if(!merged.has(key(c))) merged.set(key(c),c); else { const existing=merged.get(key(c)); existing.yc_batch=c.yc_batch; } }
const all=[...merged.values()].sort((a,b)=>{
  const priority=c=>c.category==='YC global'?3:c.category==='YC India'?2:1;
  return priority(a)-priority(b)||a.name.localeCompare(b.name);
}).slice(0,300);
const enrichment=JSON.parse(await fs.readFile('scripts/company-enrichment.json','utf8'));
for(const company of all)if(enrichment[company.name])Object.assign(company,enrichment[company.name]);
await fs.writeFile('frontend/data/companies.json',JSON.stringify(all,null,2)+'\n');
await fs.writeFile('frontend/data/company-link-review.json',JSON.stringify(review,null,2)+'\n');
console.log(`Directory: ${all.length} unique source-checked destinations, ${review.length} excluded pending review.`);
