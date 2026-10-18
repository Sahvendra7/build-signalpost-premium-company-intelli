import {Suspense} from 'react';
import {EvidenceBrowser} from '@/components/signalpost/evidence';
export default function Page(){return <Suspense fallback={<div className='loading-state'>Opening evidence library…</div>}><EvidenceBrowser/></Suspense>}
