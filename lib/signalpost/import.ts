import {AVAILABILITIES,isRecord,safeUrl,type Envelope,type ResearchRun,type Report,type Profile} from './domain';
export type Artifact={name:string;text:string};
export class ImportError extends Error{constructor(public diagnostics:string[]){super(diagnostics.join('\n'));this.name='ImportError'}}
function validateJson(v:unknown,path:string,depth=0):void{if(depth>40)throw new ImportError([`${path}: data nesting exceeds the safe limit.`]);if(typeof v==='number'&&!Number.isFinite(v))throw new ImportError([`${path}: non-finite numbers are not supported.`]);if(Array.isArray(v))v.forEach(x=>validateJson(x,path,depth+1));else if(isRecord(v))Object.values(v).forEach(x=>validateJson(x,path,depth+1))}
const iso=(v:unknown)=>typeof v==='string'&&/T.*(Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
function requiredArrays(r:Record<string,unknown>,keys:string[],at:string,errors:string[]){for(const k of keys)if(!Array.isArray(r[k]))errors.push(`${at}: ${k} must be an array.`)}
export function validateEnvelope(v:unknown,at='Envelope'):Envelope{
 const errors:string[]=[];validateJson(v,at);if(!isRecord(v))throw new ImportError([`${at}: expected an object.`]);
 if(!isRecord(v.run)){throw new ImportError([`${at}: expected competition OUTPUT_CONTRACT envelope with run, claims and evidence. Internal batch/profile records are not display envelopes.`])}
 const run=v.run;if(typeof run.run_id!=='string'||!run.run_id.trim())errors.push(`${at}: missing run.run_id.`);
 if(!['completed','failed'].includes(String(run.terminal_status)))errors.push(`${at}: run must have a terminal status completed or failed.`);
 if(v.organisation_number!==null&&(typeof v.organisation_number!=='string'||!/^\d{9}$/.test(v.organisation_number)))errors.push(`${at}: organisation_number must be a nine-digit string or null.`);
 if(v.organisation_number===null&&run.terminal_status!=='failed')errors.push(`${at}: null organisation number requires failed status.`);
 for(const key of ['started_at','completed_at'])if(run[key]!=null&&!iso(run[key]))errors.push(`${at}: invalid run.${key}.`);
 requiredArrays(v,['claims','evidence','changes','errors'],at,errors);
 if(!isRecord(v.operations))errors.push(`${at}: operations must be an object.`);
 const ids=new Set<string>();for(const [i,raw] of (Array.isArray(v.evidence)?v.evidence:[]).entries()){
  const p=`${at}, evidence ${i+1}`;if(!isRecord(raw)){errors.push(`${p}: expected object.`);continue}
  if(typeof raw.id!=='string'||!raw.id||ids.has(raw.id))errors.push(`${p}: missing or duplicate evidence id.`);else ids.add(raw.id);
  if(!safeUrl(raw.source_url))errors.push(`${p}: source URL must be HTTP(S) without credentials.`);
  if(!iso(raw.retrieved_at))errors.push(`${p}: retrieval timestamp needs a timezone.`);
  if(typeof raw.content_sha256!=='string'||!/^[a-fA-F0-9]{64}$/.test(raw.content_sha256))errors.push(`${p}: expected SHA-256 (64 hex characters).`);
  if(raw.source_title!=null&&typeof raw.source_title!=='string')errors.push(`${p}: source_title must be text.`);
  if(typeof raw.claim_span!=='string'||typeof raw.source_class!=='string')errors.push(`${p}: claim_span and source_class must be strings.`);
 }
 const keys=new Set<string>();for(const [i,c] of (Array.isArray(v.claims)?v.claims:[]).entries()){
  const p=`${at}, claim ${i+1}`;if(!isRecord(c)){errors.push(`${p}: expected object.`);continue}
  if(typeof c.key!=='string'||!c.key||keys.has(c.key))errors.push(`${p}: missing or duplicate claim key.`);else keys.add(c.key);
  if(typeof c.field!=='string'||typeof c.category!=='string')errors.push(`${p}: field/category missing.`);
  if(!(AVAILABILITIES as readonly unknown[]).includes(c.availability))errors.push(`${p}: invalid availability; unverified is a change type, not claim availability.`);
  if(!Array.isArray(c.evidence_ids)||c.evidence_ids.some(id=>typeof id!=='string'||!ids.has(id)))errors.push(`${p}: evidence_ids must resolve inside the same envelope.`);
  if(c.availability==='available'&&(c.value===null||c.value===undefined||!Array.isArray(c.evidence_ids)||!c.evidence_ids.length||typeof c.confidence!=='number'||c.confidence<0||c.confidence>1))errors.push(`${p}: available value needs value, confidence and supporting evidence.`);
  if(c.availability!=='available'&&(c.value!==null||c.confidence!==null||!Array.isArray(c.evidence_ids)||c.evidence_ids.length))errors.push(`${p}: non-available value/confidence must be null with empty evidence_ids.`);
  if(c.period!==undefined&&(!isRecord(c.period)||Object.values(c.period).some(x=>typeof x!=='string')))errors.push(`${p}: malformed reporting period.`);
  for(const k of ['currency','account_type','unit','reason','method','last_verified_at'])if(c[k]!=null&&typeof c[k]!=='string')errors.push(`${p}: ${k} must be text.`);
 }
 for(const [i,c] of (Array.isArray(v.changes)?v.changes:[]).entries()){
  if(!isRecord(c)||!['added','removed','changed','unverified','unavailable'].includes(String(c.change_type))){errors.push(`${at}, change ${i+1}: invalid change_type.`);continue}
  for(const k of ['evidence','previous_evidence'])if(c[k]!=null){const e=c[k];if(!isRecord(e)||(e.source_url!==undefined&&!safeUrl(e.source_url)))errors.push(`${at}, change ${i+1}: invalid ${k}.`)}
  if(c.fields_retained!==undefined&&(!Array.isArray(c.fields_retained)||c.fields_retained.some(x=>typeof x!=='string')))errors.push(`${at}: fields_retained must be text array.`);
  if(c.period!==undefined&&(!isRecord(c.period)||Object.values(c.period).some(x=>typeof x!=='string')))errors.push(`${at}: malformed change reporting period.`);
  for(const k of ['currency','account_type'])if(c[k]!=null&&typeof c[k]!=='string')errors.push(`${at}: change ${k} must be text.`);
  if(c.current_attempt!==undefined&&!isRecord(c.current_attempt))errors.push(`${at}: invalid current_attempt.`);
 }
 if(Array.isArray(v.errors)&&v.errors.some(e=>!isRecord(e)||typeof e.code!=='string'))errors.push(`${at}: errors require a code.`);
 if(v.identity!==undefined&&(!isRecord(v.identity)||typeof v.identity.anchored!=='boolean'||(v.identity.legal_name!=null&&typeof v.identity.legal_name!=='string')))errors.push(`${at}: malformed identity.`);
 if(v.company_status!==undefined&&(!isRecord(v.company_status)||typeof v.company_status.state!=='string'||!Array.isArray(v.company_status.reasons)||v.company_status.reasons.some(x=>typeof x!=='string')))errors.push(`${at}: malformed company_status.`);
 if(v.modules!==undefined&&(!isRecord(v.modules)||Object.values(v.modules).some(m=>!isRecord(m)||typeof m.state!=='string'||(m.note!=null&&typeof m.note!=='string'))))errors.push(`${at}: malformed module states.`);
 if(v.company_summary!==undefined){const s=v.company_summary;if(!isRecord(s)||!Array.isArray(s.sections)||s.sections.some(sec=>!isRecord(sec)||typeof sec.id!=='string'||typeof sec.title!=='string'||!Array.isArray(sec.statements)||sec.statements.some(st=>!isRecord(st)||typeof st.text!=='string'||!Array.isArray(st.claim_keys)||st.claim_keys.some(k=>typeof k!=='string'||!keys.has(k))||!Array.isArray(st.evidence_ids)||st.evidence_ids.some(id=>typeof id!=='string'||!ids.has(id)))))errors.push(`${at}: summary requires well-formed sections and resolvable claim/evidence identifiers.`)}
 // Optional extensions are validated before any component can consume them.
 if(isRecord(v.identity)){for(const key of ['legal_name','legal_form','registry_status','evidence_id'])if(v.identity[key]!=null&&typeof v.identity[key]!=='string')errors.push(`${at}: identity.${key} must be text.`);if(v.identity.anchored===true&&(typeof v.identity.evidence_id!=='string'||!ids.has(v.identity.evidence_id)))errors.push(`${at}: anchored identity needs a resolvable evidence_id.`)}
 if(isRecord(v.company_summary)&&v.company_summary.overview!=null&&typeof v.company_summary.overview!=='string')errors.push(`${at}: summary overview must be text.`);
 for(const c of (Array.isArray(v.changes)?v.changes:[])){if(!isRecord(c))continue;for(const key of ['category','field','module','materiality','last_verified_at'])if(c[key]!=null&&typeof c[key]!=='string')errors.push(`${at}: change.${key} must be text.`);if(isRecord(c.current_attempt)&&Object.values(c.current_attempt).some(x=>x!==null&&typeof x!=='string'))errors.push(`${at}: current_attempt values must be text.`);for(const key of ['evidence','previous_evidence'])if(isRecord(c[key])&&Object.values(c[key]).some(x=>x!==null&&typeof x!=='string'))errors.push(`${at}: evidence pointer fields must be text.`)}
 if(Array.isArray(v.errors)&&v.errors.some(e=>isRecord(e)&&e.message!=null&&typeof e.message!=='string'))errors.push(`${at}: error messages must be text.`);
 if(isRecord(v.operations)&&['requests','bytes','runtime_ms','third_party_cost_usd','llm_calls','llm_input_tokens','llm_output_tokens'].some(k=>v.operations && isRecord(v.operations) && v.operations[k]!=null&&(typeof v.operations[k]!=='number'||!Number.isFinite(v.operations[k])||(v.operations[k] as number)<0)))errors.push(`${at}: operation counts must be non-negative finite numbers.`);
 if(errors.length)throw new ImportError(errors);
 // Snapshot paths and original input records are not browser resources. Keep them out of the display model.
 const result=structuredClone(v);delete result.input_record;result.evidence=(result.evidence as Record<string,unknown>[]).map(e=>{delete e.snapshot_path;return e});return result as unknown as Envelope;
}
export function parseLines(text:string,name:string):unknown[]{const out:unknown[]=[];for(const [i,line]of text.split(/\r?\n/).entries()){if(!line.trim())continue;try{out.push(JSON.parse(line))}catch{throw new ImportError([`${name}, line ${i+1}: invalid JSON. Fix this line and validate again.`])}}return out}
function validateReport(v:Record<string,unknown>):Report{
 const errors:string[]=[];if(typeof v.run_id!=='string'||!v.run_id)errors.push('Report needs a run_id.');
 for(const k of ['runtime_ms','input_rows','emitted_envelopes','unique_companies_researched'])if(v[k]!=null&&(typeof v[k]!=='number'||!Number.isFinite(v[k])||(v[k] as number)<0))errors.push(`Report ${k} must be a non-negative number.`);
 for(const k of ['operations','claims','terminal_status_counts','category_coverage','category_available_rate','area_coverage','module_states','error_codes','validation','deadline'])if(v[k]!=null&&!isRecord(v[k]))errors.push(`Report ${k} must be an object.`);
 for(const k of ['started_at','completed_at'])if(v[k]!=null&&!iso(v[k]))errors.push(`Report ${k} needs a timezone-aware timestamp.`);
 function checkNumbers(x:unknown,path:string){if(isRecord(x))for(const[k,n]of Object.entries(x)){if(isRecord(n))checkNumbers(n,`${path}.${k}`);else if(typeof n!=='number'||!Number.isFinite(n)||n<0)errors.push(`${path}.${k} must be a non-negative number.`)}}
 for(const k of ['operations','claims','terminal_status_counts','category_coverage','category_available_rate','area_coverage','module_states','error_codes'])if(isRecord(v[k]))checkNumbers(v[k],`Report ${k}`);
 if(isRecord(v.validation)&&v.validation.passed!==undefined&&typeof v.validation.passed!=='boolean')errors.push('Report validation.passed must be boolean.');
 if(errors.length)throw new ImportError(errors);const r=structuredClone(v);delete r.viewer;return r as Report;
}
export function stageImport(files:Artifact[]):ResearchRun{
 if(!files.length)throw new ImportError(['Choose envelopes.jsonl and/or report.json; profiles.jsonl is an optional companion.']);
 if(files.reduce((n,f)=>n+f.text.length,0)>25_000_000)throw new ImportError(['This import exceeds 25 MB. Split it into smaller runs.']);
 const envelopes:Envelope[]=[],profiles:Profile[]=[];let report:Report|undefined;const warnings:string[]=[];
 for(const f of files){const rows=f.name.toLowerCase().endsWith('.jsonl')?parseLines(f.text,f.name):(()=>{try{return [JSON.parse(f.text)]}catch{throw new ImportError([`${f.name}: expected JSON or JSONL. Compressed files are not supported; decompress first.`])}})();
 for(const[i,v]of rows.entries()){
  validateJson(v,f.name);if(!isRecord(v))throw new ImportError([`${f.name}, record ${i+1}: expected object.`]);
  if('run'in v||Array.isArray(v.claims)){envelopes.push(validateEnvelope(v,`${f.name}, record ${i+1}`))}
  else if('evidence'in v&&typeof v.organisation_number==='string'&&isRecord(v.evidence)){if(!/^\d{9}$/.test(v.organisation_number))throw new ImportError([`${f.name}: invalid profile organisation number.`]);if(Object.values(v.evidence).some(m=>!isRecord(m)||(m.status!=null&&typeof m.status!=='string')))throw new ImportError([`${f.name}: profile module evidence must be records with textual status when supplied.`]);if(profiles.some(p=>p.organisation_number===v.organisation_number))throw new ImportError([`${f.name}: duplicate profile organisation number.`]);profiles.push(v as Profile)}
  else if(typeof v.run_id==='string'&&!('profile'in v)&&!('state'in v)){if(report)throw new ImportError(['Choose only one report per import.']);report=validateReport(v)}
  else throw new ImportError([`${f.name}, record ${i+1}: unsupported artifact. Use competition envelopes, optional profiles and report, not the internal batch wrapper.`]);
 }}
 const runs=new Set(envelopes.map(e=>e.run.run_id));if(report)runs.add(report.run_id);if(runs.size!==1)throw new ImportError([runs.size?'Files contain different run IDs. Import each run separately.':'No run ID found. Profiles alone cannot identify a run; include report or envelopes.']);
 const seen=new Set<string>();for(const e of envelopes){if(e.organisation_number&&seen.has(e.organisation_number))throw new ImportError([`Duplicate company ${e.organisation_number} in this run.`]);if(e.organisation_number)seen.add(e.organisation_number)}
 if(report?.emitted_envelopes!==undefined&&report.emitted_envelopes!==envelopes.length)warnings.push(`Report describes ${report.emitted_envelopes} envelopes; ${envelopes.length} are included. This import is partial.`);
 if(report?.claims?.available_total!==undefined&&envelopes.length&&report.claims.available_total!==envelopes.flatMap(e=>e.claims).filter(c=>c.availability==='available').length)warnings.push('Reported supported-claim count differs from the included envelopes. Report totals and selected-result counts remain separate.');
 if(!report)warnings.push('No report supplied. Report-only telemetry is not available.');if(!envelopes.length)warnings.push('No envelopes supplied. Company results and evidence are unavailable.');
 if(profiles.some(p=>!seen.has(p.organisation_number)))warnings.push('Some companion profiles have no matching envelope. They will not create claims or companies.');
 const synthetic=envelopes.some(e=>e.claims.some(c=>c.method==='synthetic_fixture'));if(synthetic)warnings.push('This import contains explicitly synthetic fixture claims. It is not official research.');
 if(synthetic&&envelopes.some(e=>e.claims.some(c=>c.availability==='available'&&c.method!=='synthetic_fixture')))throw new ImportError(['Synthetic fixture claims and real claims cannot share an import. Import them separately.']);
 return {id:[...runs][0],envelopes,report,profiles,warnings,demo:synthetic,importedAt:new Date().toISOString()};
}
