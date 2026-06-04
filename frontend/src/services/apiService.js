import { getToken } from './authService'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

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
    const message = data.detail || data.message || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return data
}

// ===== DASHBOARD =====

export const getDashboard = async () => {
  return request('/api/dashboard', { method: 'GET' })
}

// ===== SKILLS (with backend filtering) =====

export const getSkills = async (params = {}) => {
  const queryParts = []
  if (params.query) queryParts.push(`query=${encodeURIComponent(params.query)}`)
  if (params.level_filter && params.level_filter !== 'All') queryParts.push(`level_filter=${encodeURIComponent(params.level_filter)}`)
  if (params.verified_only) queryParts.push('verified_only=true')
  if (params.sort_by) queryParts.push(`sort_by=${params.sort_by}`)

  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return request(`/api/skills${qs}`, { method: 'GET' })
}

export const addSkill = async (skillName) => {
  return request(`/api/skills?skill_name=${encodeURIComponent(skillName)}`, {
    method: 'POST',
  })
}

export const verifySkill = async (skillId, verifiedScore, level = 'Intermediate', verified = true) => {
  return request(`/api/skills/${skillId}/verify?verified_score=${verifiedScore}&level=${encodeURIComponent(level)}&verified=${verified}`, {
    method: 'PUT',
  })
}

// ===== ASSESSMENTS =====

export const getAssessments = async () => {
  return request('/api/assessments', { method: 'GET' })
}

export const saveAssessmentResult = async (assessmentName, score, skillName = null, strengths = [], improvements = [], status = 'Verified') => {
  return request('/api/assessments/save', {
    method: 'POST',
    body: JSON.stringify({
      assessment_name: assessmentName,
      score,
      skill_name: skillName,
      strengths,
      improvements,
      status,
    }),
  })
}

// ===== ACTIVITIES =====

export const getActivities = async (limit = 20) => {
  return request(`/api/activities?limit=${limit}`, { method: 'GET' })
}

// ===== OPPORTUNITIES (with backend filtering) =====

export const getOpportunities = async (params = {}) => {
  const queryParts = []
  if (params.type_filter && params.type_filter !== 'All') queryParts.push(`type_filter=${encodeURIComponent(params.type_filter)}`)
  if (params.location_filter && params.location_filter !== 'All') queryParts.push(`location_filter=${encodeURIComponent(params.location_filter)}`)
  if (params.min_match) queryParts.push(`min_match=${params.min_match}`)
  if (params.skill_filter && params.skill_filter !== 'All') queryParts.push(`skill_filter=${encodeURIComponent(params.skill_filter)}`)
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`)
  if (params.sort_by) queryParts.push(`sort_by=${params.sort_by}`)

  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return request(`/api/opportunities${qs}`, { method: 'GET' })
}

// ===== PROFILE =====

export const getProfile = async () => {
  return request('/api/profile', { method: 'GET' })
}

export const updateProfile = async (data) => {
  return request('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const getPreferences = async () => {
  return request('/api/profile/preferences', { method: 'GET' })
}

export const updatePreferences = async (data) => {
  return request('/api/profile/preferences', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ===== BADGES =====

export const getBadges = async () => {
  return request('/api/badges', { method: 'GET' })
}

// ===== OPPORTUNITY RECOMMENDATIONS =====

export const saveOpportunityRecommendation = async (role, reason, skillsMatched, searchLink, skillName) => {
  return request('/api/opportunities/recommend', {
    method: 'POST',
    body: JSON.stringify({
      role,
      reason,
      skills_matched: skillsMatched || [],
      search_link: searchLink,
      skill_name: skillName,
    }),
  })
}
