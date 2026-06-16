'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'

// Store consent in a first-party cookie — same-origin cookie reads/writes
// never trigger Safari's privacy notice, unlike localStorage writes.
const COOKIE_NAME = 'lxs_consent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function getConsentCookie(): 'accepted' | 'declined' | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)lxs_consent=([^;]*)/)
  const v = m?.[1]
  return v === 'accepted' || v === 'declined' ? v : null
}

function setConsentCookie(value: 'accepted' | 'declined') {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

type Props = {
  gaId: string | null
  klaviyoId: string | null
  phKey: string | null
}

export default function ConsentBanner({ gaId, klaviyoId, phKey }: Props) {
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null)
  const [mounted, setMounted] = useState(false)

  // No analytics configured (or Safari where they're suppressed) — render nothing
  if (!gaId && !klaviyoId && !phKey) return null

  useEffect(() => {
    setConsent(getConsentCookie())
    setMounted(true)
  }, [])

  const accept = () => {
    setConsentCookie('accepted')
    setConsent('accepted')
  }

  const decline = () => {
    setConsentCookie('declined')
    setConsent('declined')
  }

  return (
    <>
      {consent === 'accepted' && gaId && (
        <>
          {/* Script and collect endpoint served through first-party proxy — avoids Safari ITP */}
          <Script src={`/proxy/ga/gtag.js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              transport_url: window.location.origin + '/proxy/ga',
              first_party_collection: true,
            });
          `}</Script>
        </>
      )}

      {consent === 'accepted' && klaviyoId && (
        // Script served from first-party proxy; internal API URLs rewritten to /proxy/kl/*
        <Script src={`/proxy/kl-script?company_id=${klaviyoId}`} strategy="afterInteractive" />
      )}

      {consent === 'accepted' && phKey && (
        <Script id="posthog-init" strategy="afterInteractive">{`
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.people.toString(20)+" (stub)"},o="init be qs fs gs rq on once off identify createAlias alias set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonPropertiesForFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||(window.posthog=[]));
          posthog.init('${phKey}', {
            api_host: window.location.origin + '/proxy/ph',
            ui_host: 'https://us.posthog.com',
            person_profiles: 'identified_only',
          });
        `}</Script>
      )}

      {mounted && consent === null && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 300,
          background: '#111111',
          borderTop: '1px solid rgba(255,255,255,0.09)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <p style={{
            margin: 0,
            fontSize: '11px',
            letterSpacing: '0.03em',
            color: '#999',
            fontFamily: "'Inter', sans-serif",
            flex: 1,
            minWidth: '200px',
          }}>
            We use analytics cookies to understand how visitors use our site.
            {' '}
            <span style={{ color: '#666' }}>No personal data is sold to third parties.</span>
          </p>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={decline}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#777',
                padding: '6px 16px',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                borderRadius: '2px',
              }}
            >
              Decline
            </button>
            <button
              onClick={accept}
              style={{
                background: '#c09530',
                border: 'none',
                color: '#0a0a0a',
                padding: '6px 18px',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                borderRadius: '2px',
              }}
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  )
}
