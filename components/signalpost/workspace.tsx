'use client';
import {createContext,useContext,useState,useEffect,useRef,useMemo,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {demoRuns} from '@/lib/signalpost/fixtures';
import {SignalpostReadService,canSelect,type ResearchRun,type Company,type Claim,type Evidence} from '@/lib/signalpost/domain';
import {initialWorkspace,loadWorkspace,saveWorkspace,withImportedRun,type Workspace} from '@/lib/signalpost/storage';
type Inspection={company:Company;claim?:Claim;evidence?:Evidence;heading?:string};
type Context={workspace:Workspace;ready:boolean;error:string;runs:ResearchRun[];run?:ResearchRun;companies:Company[];inspection:Inspection|null;inspect:(i:Inspection|null)=>void;update:(patch:Partial<Workspace>|((w:Workspace)=>Partial<Workspace>))=>Promise<void>;importRun:(r:ResearchRun)=>Promise<void>;toggleCompare:(id:string)=>void;toast:(s:string)=>void;message:string;retry:()=>void};
const C=createContext<Context|null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}){
 const [workspace,setWorkspace]=useState<Workspace>(initialWorkspace),[ready,setReady]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[inspection,inspect]=useState<Inspection|null>(null);const current=useRef(workspace);const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);const path=usePathname();const queue=useRef<Promise<void>>(Promise.resolve());
 const toast=(s:string)=>{setMessage(s);clearTimeout(timer.current);timer.current=setTimeout(()=>setMessage(''),4200)};
 const retry=()=>{setReady(false);loadWorkspace().then(w=>{current.current=w;setWorkspace(w);setError('')}).catch(e=>{setError(e.message);if(current.current===initialWorkspace){const empty={...initialWorkspace,mode:'disconnected' as const};current.current=empty;setWorkspace(empty)}}).finally(()=>setReady(true))};
 useEffect(()=>{retry();return()=>clearTimeout(timer.current)},[]);
 useEffect(()=>{inspect(null)},[path]);
 async function update(patch:Partial<Workspace>|((w:Workspace)=>Partial<Workspace>)){
 const operation=queue.current.catch(()=>{}).then(async()=>{const next={...current.current,...(typeof patch==='function'?patch(current.current):patch)};try{await saveWorkspace(next);current.current=next;setWorkspace(next);setError('')}catch(e){const text=e instanceof Error?e.message:'Could not save changes.';setError(text);throw new Error(text)}});queue.current=operation;return operation;
}
 async function importRun(r:ResearchRun){await update(w=>withImportedRun(w,r));toast('Run imported. Your workspace now uses these results.')}
 const runs=workspace.mode==='demo'?demoRuns:workspace.mode==='imported'?workspace.runs:[];const service=useMemo(()=>new SignalpostReadService(runs,runs.some(r=>r.id===workspace.activeRun)?workspace.activeRun:runs[0]?.id),[runs,workspace.activeRun]);const run=service.getRun();const cs=useMemo(()=>service.listCompanies(),[service]);
 function toggleCompare(id:string){const ids=current.current.compare;if(!canSelect(ids,id)){toast('Compare up to four companies. Remove one to add another.');return}update(w=>({compare:w.compare.includes(id)?w.compare.filter(x=>x!==id):w.compare.length<4?[...w.compare,id]:w.compare})).catch(e=>toast(e.message))}
 return <C.Provider value={{workspace,ready,error,runs,run,companies:cs,inspection,inspect,update,importRun,toggleCompare,toast,message,retry}}>{children}</C.Provider>
}
export function useWorkspace(){const v=useContext(C);if(!v)throw new Error('Workspace provider required');return v}
