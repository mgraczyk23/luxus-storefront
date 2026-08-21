'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { isAgeVerified, AGE_VERIFIED_EVENT } from '@/lib/age-gate'

// Klaviyo's onsite JS can render its own full-screen popup forms, which must
// never be able to appear on top of (or steal focus from) the age-gate
// dialog. Loading is deferred until age verification is complete — this is
// purely a load-timing change, not a consent gate: once verified, Klaviyo
// still loads unconditionally for every visitor (no passive tracking fires
// until a visitor interacts with a form), matching the site's existing
// consent design.
export default function KlaviyoLoader({ klaviyoId }: { klaviyoId: string }) {
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (isAgeVerified()) { setVerified(true); return }
    const handler = () => setVerified(true)
    window.addEventListener(AGE_VERIFIED_EVENT, handler)
    return () => window.removeEventListener(AGE_VERIFIED_EVENT, handler)
  }, [])

  if (!verified) return null

  return (
    <>
      <Script id="klaviyo-init" strategy="afterInteractive">{`!function(){if(!window.klaviyo){window._klOnsite=window._klOnsite||[];try{window.klaviyo=new Proxy({},{get:function(n,i){return"push"===i?function(){var n;(n=window._klOnsite).push.apply(n,arguments)}:function(){for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];var t="function"==typeof o[o.length-1]?o.pop():void 0,e=new Promise((function(n){window._klOnsite.push([i].concat(o,[function(i){t&&t(i),n(i)}]))}));return e}}})}catch(n){window.klaviyo=window.klaviyo||[],window.klaviyo.push=function(){var n;(n=window._klOnsite).push.apply(n,arguments)}}}}();`}</Script>
      <Script
        src={`https://static.klaviyo.com/onsite/js/${klaviyoId}/klaviyo.js?company_id=${klaviyoId}`}
        strategy="afterInteractive"
      />
    </>
  )
}
