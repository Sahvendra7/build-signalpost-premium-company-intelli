import Link from 'next/link';
export default function NotFound(){return <div className='not-found'><p className='eyebrow'>A MISSING OBSERVATION</p><h1>Nothing at this address.</h1><p>This page does not exist. Your research is still here—return to your workspace or search for a company above.</p><Link className='button primary' href='/'>Back to overview</Link></div>}
