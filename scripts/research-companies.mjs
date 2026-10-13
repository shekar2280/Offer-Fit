// Reproducible official-source discovery. No private account or mailbox access.
import fs from 'node:fs/promises';
const mode = process.argv[2] || 'inspect';
const checked = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
const decode = text => text.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
async function get(url) {
  const response = await fetch(url, {signal: AbortSignal.timeout(15000), headers: {'User-Agent':'OfferFit-career-directory-research/1.0'}});
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return { html: await response.text(), url: response.url };
}
function page(html) { const encoded = html.match(/data-page="([^"]+)"/)?.[1]; if (!encoded) throw new Error('YC page structure changed'); return JSON.parse(decode(encoded)).props; }
const root = 'https://www.ycombinator.com/companies/location/india';
const first = page((await get(root)).html);
if(mode === 'inspect') { console.log({count:first.companies.length,totalPages:first.totalPages,currentPage:first.currentPage}); }
else {
  const discovered = [...first.companies];
  for (let index = first.currentPage + 1; index <= first.totalPages; index++) {
    const current = page((await get(`${root}?page=${index}`)).html); discovered.push(...current.companies);
    console.log(`India page ${index}: ${current.companies.length}`);
  }
  for (const path of ['b2b','developer-tools','artificial-intelligence']) {
    try { const result = page((await get(`https://www.ycombinator.com/companies/industry/${path}`)).html); discovered.push(...result.companies); console.log(`${path}: ${result.companies.length}`); }
    catch(error) { console.log(`${path}: ${error.message}`); }
  }
  const unique = [...new Map(discovered.filter(c=>c.ycdc_status==='Active' || c.ycdc_status==='Public').map(c=>[c.slug,c])).values()];
  const candidates=[];
  for(let start=0;start<unique.length;start+=5) {
    await Promise.all(unique.slice(start,start+5).map(async c=> {
      const profile=`https://www.ycombinator.com/companies/${c.slug}`;
      try {
        const {html} = await get(profile);
        const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(m=>decode(m[1]));
        const jobs=hrefs.find(h=>h===`/companies/${c.slug}/jobs` || h===`${profile}/jobs`);
        if(!jobs) return;
        const destination=new URL(jobs,profile).toString();
        const result=await get(destination);
        if(!/jobs|careers|hiring/i.test(result.html)) return;
        const india=c.country==='India' || /india|bengaluru|bangalore|mumbai|delhi|gurugram|hyderabad|pune/i.test(c.location||'');
        candidates.push({id:`yc-${c.slug}`,name:c.name,category:india?'YC India':'YC global',sector:c.one_liner?.slice(0,100)||'Software',careers_url:destination,source_url:profile,checked_at:checked,verification:'Official YC jobs destination',hiring_note:india?'India company; role experience requirements need review':'India / remote eligibility unverified; check each role',yc_batch:c.batch_name?.toUpperCase()||null,funding_date:null,funding_source:null,location:c.location||'',website:c.website||'',company_status:c.ycdc_status});
      } catch(error) { console.log(`Skipped ${c.name}: ${error.message}`); }
    }));
    console.log(`Verified ${candidates.length} / ${unique.length} YC candidates; processed ${Math.min(start+5,unique.length)}`);
  }
  candidates.sort((a,b)=>(a.category==='YC India'?-1:1)-(b.category==='YC India'?-1:1)||a.name.localeCompare(b.name));
  await fs.mkdir('frontend/data',{recursive:true});
  await fs.writeFile('frontend/data/yc-companies.json',JSON.stringify(candidates,null,2)+'\n');
  console.log(`Saved ${candidates.length} official YC careers destinations.`);
}
