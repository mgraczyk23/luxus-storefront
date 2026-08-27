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
  phKey: string | null
}

export default function ConsentBanner({ phKey }: Props) {
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setConsent(getConsentCookie())
    setMounted(true)
  }, [])

  // No analytics configured — render nothing (hooks must come first per React rules)
  if (!phKey) return null

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
      {consent === 'accepted' && phKey && (
        <Script id="posthog-init" strategy="afterInteractive">{`
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="No qo jo init ol ll nl sl vl wa al fl el capture getExtension ul Do calculateEventProperties bl register register_once register_for_session unregister unregister_for_session xl rl wl getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Cl identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset Tl shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty kl ml createPersonProfile setInternalOrTestUser Sl Bo Ho opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing pl debug ka En getPageViewId captureTraceFeedback captureTraceMetric Ko".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
          posthog.init('${phKey}', {
            api_host: window.location.origin + '/proxy/ph',
            ui_host: 'https://us.posthog.com',
            defaults: '2026-05-30',
            person_profiles: 'identified_only',
            disable_session_recording: true,
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
