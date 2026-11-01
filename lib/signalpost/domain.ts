export const REVISION = 'ff3b5152221be3e39c6f6532f47ebf6f61442336';
export const AVAILABILITIES = ['available','not_available','blocked','not_applicable','ambiguous','failed'] as const;
export type Availability = typeof AVAILABILITIES[number];
export const CATEGORIES = ['identity','description','filings','leadership','locations','websites','public_activity','hiring','relationships','registry_activity'] as const;
export type Json = null | boolean | number | string | Json[] | {[key:string]:Json};
export type Evidence = {id:string;source_url:string;source_class:string;retrieved_at:string;content_sha256:string;claim_span:string;effective_at?:string;source_title?:string};
export type Claim = {key:string;field:string;category:string;value:Json;availability:Availability;confidence:number|null;evidence_ids:string[];reason?:string;method?:string;period?:{from?:string;to?:string};currency?:string;account_type?:string;unit?:string;carried_forward?:boolean;last_verified_at?:string;event_date?:string};
export type EvidencePointer = {source_url?:string;retrieved_at?:string;content_sha256?:string;evidence_id?:string};
export type Change = {change_type:'added'|'removed'|'changed'|'unverified'|'unavailable';category?:string;field?:string;old_value?:Json;new_value?:Json;previous_evidence?:EvidencePointer|null;evidence?:EvidencePointer|null;materiality?:string;module?:string;fields_retained?:string[];last_verified_at?:string;current_attempt?:{status?:string;note?:string;retrieved_at?:string};period?:Claim['period'];currency?:string;account_type?:string};
export type Summary = {method?:string;overview?:string|null;sections:{id:string;title:string;statements:{text:string;claim_keys:string[];evidence_ids:string[]}[]}[]};
export type Envelope = {organisation_number:string|null;run:{run_id:string;started_at?:string;completed_at?:string;terminal_status:'completed'|'failed'};claims:Claim[];evidence:Evidence[];changes:Change[];errors:{code:string;message?:string}[];operations:{requests?:number;runtime_ms?:number;third_party_cost_usd?:number};identity?:{anchored:boolean;legal_name?:string;legal_form?:string;registry_status?:string;evidence_id?:string;carried_forward?:boolean};company_status?:{state:string;reasons:string[]};company_summary?:Summary;modules?:Record<string,{state:string;note?:string}>;refresh?:{compared:boolean;counts?:Record<string,number>;carried_forward_modules?:string[];unverified_modules?:string[]};input_position?:number};
export type Report = {run_id:string;started_at?:string;completed_at?:string;runtime_ms?:number;input_rows?:number;emitted_envelopes?:number;unique_companies_researched?:number;terminal_status_counts?:Record<string,number>;category_coverage?:Record<string,Record<string,number>>;category_available_rate?:Record<string,number>;area_coverage?:Record<string,number>;module_states?:Record<string,Record<string,number>>;error_codes?:Record<string,number>;claims?:Record<string,number>;operations?:{requests?:number;bytes?:number;third_party_cost_usd?:number;llm_calls?:number;request_latency?:Record<string,number>;company_runtime?:Record<string,number>};validation?:{passed?:boolean;checks?:Record<string,Json>;findings?:Record<string,Json>};deadline?:Record<string,Json>};
export type Profile = {organisation_number:string;evidence:Record<string,unknown>;[key:string]:unknown};
export type ResearchRun = {id:string;envelopes:Envelope[];report?:Report;profiles?:Profile[];artifacts?:{name:string;text:string}[];importedAt?:string;demo?:boolean;warnings:string[]};
export type Company = Envelope & {organisation_number:string};
export function isRecord(v:unknown):v is Record<string,unknown>{return !!v && typeof v==='object' && !Array.isArray(v)}
export function safeUrl(v:unknown):string|undefined {if(typeof v!=='string')return;try{const u=new URL(v);if(['http:','https:'].includes(u.protocol)&&!u.username&&!u.password)return u.href}catch{} }
export function label(s:string){return s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
export function valueText(v:unknown):string {if(v===null||v===undefined)return 'Not available';if(typeof v==='boolean')return v?'Yes':'No';if(typeof v==='number')return new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(v);if(typeof v==='string')return v;if(Array.isArray(v))return v.length?v.map(valueText).join(' · '):'None reported';if(isRecord(v))return Object.entries(v).map(([k,x])=>`${label(k)}: ${valueText(x)}`).join(' · ');return 'Not available'}
export function date(v?:string,time=false){if(!v||Number.isNaN(Date.parse(v)))return 'Not available';return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',...(time?{hour:'2-digit',minute:'2-digit',timeZoneName:'short',timeZone:'UTC'}:{})}).format(new Date(v))}
export function claimValue(c:Claim){const text=valueText(c.value);return c.availability!=='available'?label(c.availability):typeof c.value==='number'&&c.currency?`${c.currency} ${text}${c.unit?` ${c.unit}`:''}`:text}
export function companyName(c:Envelope){return c.identity?.legal_name || valueString(c.claims.find(x=>x.field==='legal_name'&&x.availability==='available')?.value) || c.organisation_number || 'Invalid input'}
function valueString(v:unknown){return typeof v==='string'?v:undefined}
export function companies(run?:ResearchRun):Company[]{return (run?.envelopes||[]).filter((e):e is Company=>!!e.organisation_number&&/^\d{9}$/.test(e.organisation_number))}
export function available(c:Envelope){return c.claims.filter(x=>x.availability==='available')}
export function financialKey(c:Claim){return [c.field,c.period?.from||'unknown-start',c.period?.to||'unknown-end',c.account_type||'unknown-account',c.currency||'unknown-currency',c.unit||'base'].join('|')}
export function comparable(a:Claim,b:Claim){return !!a.period?.from&&!!a.period?.to&&!!a.currency&&!!a.account_type&&financialKey(a)===financialKey(b)}
export function comparisonRows(cs:Company[]){
 const rows=new Map<string,{key:string;title:string;cells:Claim[][]}>();
 cs.forEach((company,index)=>company.claims.forEach(cl=>{
  const metadataKnown=cl.category!=='filings'||!!(cl.period?.from&&cl.period.to&&cl.currency&&cl.account_type);
  // Unknown financial metadata is not a common reporting period. Keep that company's observation separate.
  const key=cl.category==='filings'?`${financialKey(cl)}${metadataKnown?'':`|company:${index}`}`:`${cl.category}|${cl.field}`;
  if(!rows.has(key))rows.set(key,{key,title:`${label(cl.field)}${cl.category==='filings'?` · ${cl.period?.from||'?'} – ${cl.period?.to||'?'} · ${cl.currency||'currency unknown'} · ${cl.account_type||'account type unknown'}${cl.unit?` · ${cl.unit}`:''}`:''}`,cells:cs.map((co,i)=>!metadataKnown&&i!==index?[]:co.claims.filter(x=>cl.category==='filings'?financialKey(x)===financialKey(cl):x.category===cl.category&&x.field===cl.field))});
 }));return [...rows.values()];
}
export function comparisonSummary(cs:Company[],rows:ReturnType<typeof comparisonRows>){return rows.map(r=>`${r.title}\n${cs.map((c,i)=>`${companyName(c)}: ${r.cells[i].length?r.cells[i].map(cl=>claimValue(cl)).join('; '):'Not available'} · observed ${date(c.run.completed_at)}`).join('\n')}`).join('\n\n')}
export function coverage(run?:ResearchRun){const cs=companies(run);return CATEGORIES.map(cat=>({category:cat,available:cs.filter(c=>c.claims.some(x=>x.category===cat&&x.availability==='available')).length,total:cs.length}))}
export function statusCounts(run?:ResearchRun){return AVAILABILITIES.map(status=>({status,count:(run?.envelopes||[]).flatMap(c=>c.claims).filter(c=>c.availability===status).length}))}
export function reportCoverage(run?:ResearchRun){const n=run?.report?.input_rows,e=run?.report?.emitted_envelopes;return n!==undefined&&e!==undefined&&n>0&&e<=n?e/n:undefined}
export function canSelect(ids:string[],id:string){return ids.includes(id)||ids.length<4}
export function runStatus(r:ResearchRun):string{const counts=r.report?.terminal_status_counts;if(counts&&Object.values(counts).some(n=>n>0)){const failed=counts.failed||0,completed=counts.completed||0;return failed?(completed?'partial':'failed'):'completed'}return r.envelopes.length?(r.envelopes.every(e=>e.run.terminal_status==='failed')?'failed':r.envelopes.some(e=>e.run.terminal_status==='failed')?'partial':'completed'):'unverified'}
export class SignalpostReadService{
 constructor(readonly runs:ResearchRun[],readonly activeRun?:string){}
 getRun(id=this.activeRun){return this.runs.find(r=>r.id===id)||(!id?this.runs[0]:undefined)}
 listRuns(){return this.runs}
 listCompanies(){return companies(this.getRun())}
 getCompanyProfile(id:string){return this.listCompanies().find(c=>c.organisation_number===id)}
 listClaims(){return this.listCompanies().flatMap(company=>company.claims.map(claim=>({company,claim})))}
 listEvidence(){return this.listCompanies().flatMap(company=>company.evidence.map(evidence=>({company,evidence})))}
 listChanges(){return this.listCompanies().flatMap(company=>company.changes.map(event=>({company,event})))}
 getReport(id?:string){return this.getRun(id)?.report}
}
export const capabilities = {importArtifacts:true,submitBatch:false,refreshCompany:false,snapshots:false} as const;
export interface ExecutionService {submitBatch(organisations:string[]):Promise<{runId:string}>;getRunStatus(runId:string):Promise<{status:string}>;refreshCompany(organisationNumber:string):Promise<{runId:string}>}
export class UnavailableExecutionService implements ExecutionService{async submitBatch():Promise<never>{throw new Error('Live research requires a separately hosted Python adapter.')}async getRunStatus():Promise<never>{throw new Error('No HTTP execution service is connected.')}async refreshCompany():Promise<never>{throw new Error('Refresh is not exposed by the CLI-only agent.')}}
