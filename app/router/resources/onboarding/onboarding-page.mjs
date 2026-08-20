export const STORAGE_KEY = 'idts.onboarding.invitation'
const MAX_TOKEN_LENGTH = 2048
const SERVICE_ROOT = '/odata/v4/user-administration/'

export function invitationTokenFromHash (hash) {
  if (typeof hash !== 'string' || !hash.startsWith('#')) return null
  const token = new URLSearchParams(hash.slice(1)).get('token')
  if (!token || token.length > MAX_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null
  return token
}

export function continueToSapLogin ({ hash, pathname, search, storage, replaceHistory, navigate }) {
  const token = invitationTokenFromHash(hash)
  if (!token) return false
  storage.setItem(STORAGE_KEY, token)
  replaceHistory(`${pathname}${search || ''}`)
  navigate('/onboarding/authenticate')
  return true
}

export async function verifyInvitation ({ token, fetchImpl = fetch }) {
  if (!invitationTokenFromHash(`#token=${token}`)) throw safeStatusError(400)

  const csrfResponse = await fetchImpl(SERVICE_ROOT, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': 'Fetch'
    }
  })
  if (!csrfResponse.ok) throw safeStatusError(csrfResponse.status)
  const csrfToken = csrfResponse.headers.get('X-CSRF-Token')
  if (!csrfToken) throw safeStatusError(503)

  const verifyResponse = await fetchImpl(`${SERVICE_ROOT}verifySapIdentity`, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ token })
  })
  if (!verifyResponse.ok) throw safeStatusError(verifyResponse.status)
  return verifyResponse.json()
}

export function safeErrorMessage (error) {
  switch (Number(error?.status || 0)) {
    case 400:
      return 'This invitation is invalid. Ask an IDTS Project Manager to send a new invitation.'
    case 403:
      return 'The signed-in SAP account does not match this invitation.'
    case 409:
      return 'This invitation was already used or the SAP identity is already linked.'
    case 410:
      return 'This invitation has expired. Ask an IDTS Project Manager to send a new invitation.'
    case 503:
      return 'Identity verification is temporarily unavailable. Try again.'
    default:
      return 'Identity verification failed. Try again or contact an IDTS Project Manager.'
  }
}

function safeStatusError (status) {
  return Object.assign(new Error('Identity verification failed.'), { status: Number(status) || 500 })
}

function showResult (documentRef, message, type, retryable) {
  const busy = documentRef.getElementById('busy-state')
  const result = documentRef.getElementById('result-message')
  const retry = documentRef.getElementById('retry-button')
  if (busy) busy.hidden = true
  if (result) {
    result.hidden = false
    result.className = `message message-${type}`
    result.textContent = message
    result.focus?.()
  }
  if (retry) retry.hidden = !retryable
}

async function runAuthenticationPage (windowRef, documentRef) {
  const token = windowRef.sessionStorage.getItem(STORAGE_KEY)
  if (!token) {
    showResult(documentRef, 'Invitation data is missing. Open the latest IDTS invitation email and try again.', 'error', false)
    return
  }

  try {
    await verifyInvitation({ token, fetchImpl: windowRef.fetch.bind(windowRef) })
    windowRef.sessionStorage.removeItem(STORAGE_KEY)
    showResult(documentRef, 'SAP identity verified. IDTS access provisioning is pending.', 'success', false)
  } catch (error) {
    const status = Number(error?.status || 0)
    if ([400, 403, 409, 410].includes(status)) windowRef.sessionStorage.removeItem(STORAGE_KEY)
    showResult(documentRef, safeErrorMessage(error), 'error', status === 0 || status >= 500)
  }
}

function initializeBrowserPage () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const page = document.body?.dataset?.onboardingPage
  if (page === 'continue') {
    const continued = continueToSapLogin({
      hash: window.location.hash,
      pathname: window.location.pathname,
      search: window.location.search,
      storage: window.sessionStorage,
      replaceHistory: value => window.history.replaceState(null, '', value),
      navigate: value => window.location.replace(value)
    })
    if (!continued) {
      document.querySelector('.busy-row')?.setAttribute('hidden', '')
      const card = document.querySelector('.onboarding-card')
      if (card) {
        const message = document.createElement('p')
        message.className = 'message message-error'
        message.setAttribute('role', 'alert')
        message.textContent = 'This invitation link is invalid. Ask an IDTS Project Manager to send a new invitation.'
        card.append(message)
      }
    }
    return
  }
  if (page === 'authenticate') {
    const retry = document.getElementById('retry-button')
    retry?.addEventListener('click', () => {
      retry.hidden = true
      const busy = document.getElementById('busy-state')
      if (busy) busy.hidden = false
      runAuthenticationPage(window, document)
    })
    runAuthenticationPage(window, document)
  }
}

initializeBrowserPage()
