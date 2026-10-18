import {CompanyProfile} from '@/components/signalpost/profile';
export default async function Page({params,searchParams}:{params:Promise<{organisationNumber:string}>;searchParams:Promise<{run?:string}>}){const {organisationNumber}=await params;const {run}=await searchParams;return <CompanyProfile id={organisationNumber} runId={run}/>}
