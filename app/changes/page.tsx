import {Suspense} from 'react';
import {Changes} from '@/components/signalpost/changes';
export default function Page(){return <Suspense fallback={<div className='loading-state'>Opening change history…</div>}><Changes/></Suspense>}
