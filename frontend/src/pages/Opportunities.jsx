import { useEffect, useMemo, useState } from 'react'
import { getProfile } from '../services/authService'
import { mockOpportunities } from '../data/mockOpportunities'

const typeOptions = ['All', 'Internship', 'Job']
const locationOptions = ['All', 'Remote', 'Hybrid', 'Onsite']

function normalize(str) {
  return (str || '').toString().toLowerCase().trim()
}

function skillMatchText(op) {
  return [...op.requiredSkills].join(' ')
}

function getLocationBucket(location) {
  const l = normalize(location)
  if (l.includes('remote')) return 'Remote'
  if (l.includes('hybrid')) return 'Hybrid'
  if (l.includes('onsite') || l.includes('on-site') || l.includes('on site')) return 'Onsite'
  return 'All'
}

function scoreBucket(matchPct) {
  if (matchPct >= 85) return { label: 'Strong match', tone: 'success' }
  if (matchPct >= 75) return { label: 'Good match', tone: 'primary' }
  return { label: 'Potential match', tone: 'warning' }
}

function OpportunityCard({ opportunity }) {
  const tone = scoreBucket(opportunity.matchPct)

  return (
    <div className="card opp-card" role="group" aria-label={opportunity.title}>
      <div className="opp-top">
        <div>
          <div className="opp-role">{opportunity.title}</div>
          <div className="opp-company">
            {opportunity.company} · {opportunity.location}
          </div>
          <div className="opp-meta-row">
            <span className="pill pill-type">{opportunity.type}</span>
            <span className={`pill pill-tone pill-${tone.tone}`}>{tone.label}</span>
          </div>
        </div>
        <div className="match-pill" title="Match percentage">
          {opportunity.matchPct}%
          <span className="match-pill-sub"> match</span>
        </div>
      </div>

      <div className="opp-desc">{opportunity.description}</div>

      <div className="opp-skills">
        <span className="opp-skills-label">Required:</span>
        <div className="tag-list">
          {opportunity.requiredSkills.map((s) => (
            <span key={s} className="tag tag-blue">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="opp-actions">
        <button className="btn btn-primary" type="button">
          Apply
        </button>
        <button className="btn btn-ghost" type="button">
          Save
        </button>
      </div>

      <div className="opp-foot">
        Required score: <b>{opportunity.requiredScore}%</b>
      </div>
    </div>
  )
}

export default function Opportunities() {
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')

  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [location, setLocation] = useState('All')
  const [minMatch, setMinMatch] = useState('All')
  const [skillTag, setSkillTag] = useState('All')

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const p = await getProfile()
        if (!cancelled) setProfile(p)
      } catch (e) {
        if (!cancelled) setProfileError(e?.message || 'Failed to load profile')
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const allSkillTags = useMemo(() => {
    const set = new Set()
    mockOpportunities.forEach((op) => op.requiredSkills.forEach((s) => set.add(s)))
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [])

  const filtered = useMemo(() => {
    const q = normalize(query)

    const matchMin = minMatch === 'All' ? -1 : Number(minMatch)

    return mockOpportunities.filter((op) => {
      if (type !== 'All' && op.type !== type) return false

      if (location !== 'All') {
        const bucket = getLocationBucket(op.location)
        if (bucket !== location) return false
      }

      if (op.matchPct < matchMin) return false

      if (skillTag !== 'All') {
        if (!op.requiredSkills.some((s) => normalize(s) === normalize(skillTag))) return false
      }

      if (!q) return true

      const text = [op.title, op.company, op.location, skillMatchText(op)].join(' ')
      return normalize(text).includes(q)
    })
  }, [query, type, location, minMatch, skillTag])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Opportunities</h1>
        <p className="muted">Find roles matched to your verified skills</p>
      </div>

      {profileError ? <div className="card">{profileError}</div> : null}

      <div className="card opp-board">
        <div className="opp-filters">
          <div className="filter-group">
            <label className="label">Search</label>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Role, company, location, or skill"
              aria-label="Search opportunities"
            />
          </div>

          <div className="filter-group">
            <label className="label">Type</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="label">Location</label>
            <select className="select" value={location} onChange={(e) => setLocation(e.target.value)}>
              {locationOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="label">Minimum match</label>
            <select className="select" value={minMatch} onChange={(e) => setMinMatch(e.target.value)}>
              <option value="All">All</option>
              <option value="70">70%+</option>
              <option value="75">75%+</option>
              <option value="80">80%+</option>
              <option value="85">85%+</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="label">Skill tag</label>
            <select className="select" value={skillTag} onChange={(e) => setSkillTag(e.target.value)}>
              {allSkillTags.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="opp-board-head">
          <div className="muted">
            {loadingProfile ? 'Loading profile…' : `Showing matches for ${profile?.name ?? 'you'}`}
          </div>
          <div className="opp-result-count">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No opportunities found</div>
            <div className="muted">Try clearing filters or using fewer keywords.</div>
          </div>
        ) : (
          <div className="opps-grid">
            {filtered.map((op) => (
              <OpportunityCard key={op.id} opportunity={op} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


