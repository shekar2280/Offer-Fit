import fs from 'node:fs/promises';
const enrichment=JSON.parse(await fs.readFile('scripts/company-enrichment.json','utf8'));
const records=JSON.parse(await fs.readFile('frontend/data/companies.json','utf8'));
for(const company of records)if(enrichment[company.name])Object.assign(company,enrichment[company.name]);
await fs.writeFile('frontend/data/companies.json',JSON.stringify(records,null,2)+'\n');
