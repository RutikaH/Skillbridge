const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const TOKEN_KEY = 'skillbridge_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)
export const isAuthenticated = () => Boolean(getToken())

const buildHeaders = (extra = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  })

  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    const message = data.detail || data.message || 'Request failed'
    throw new Error(message)
  }

  return data
}

export const signup = async (payload) => {
  const data = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(data.access_token)
  return data
}

export const login = async (payload) => {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(data.access_token)
  return data
}

export const forgotPassword = async (payload) => {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const getProfile = async () => {
  return request('/auth/me', {
    method: 'GET',
  })
}

export const logout = () => {
  removeToken()
  return { message: 'Logged out' }
}

export const fetchWithAuth = (path, options = {}) => {
  return request(path, options)
}
