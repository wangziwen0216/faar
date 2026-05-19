const STORAGE_KEY = 'faar_admin_token'

export function getAdminToken() {
  return sessionStorage.getItem(STORAGE_KEY) || ''
}

export function setAdminToken(token) {
  if (token) sessionStorage.setItem(STORAGE_KEY, token)
  else sessionStorage.removeItem(STORAGE_KEY)
}

export function clearAdminToken() {
  sessionStorage.removeItem(STORAGE_KEY)
}
