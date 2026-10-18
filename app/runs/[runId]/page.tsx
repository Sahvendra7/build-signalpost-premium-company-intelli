import {RunDetail} from '@/components/signalpost/runs';
export default async function Page({params}:{params:Promise<{runId:string}>}){const {runId}=await params;return <RunDetail id={runId}/>}
