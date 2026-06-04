import { useCallback, useEffect, useMemo, useState } from 'react'
import { getOpportunities } from '../services/apiService'

const typeOptions = ['All', 'Internship', 'Job']
const locationOptions = ['All', 'Remote', 'Hybrid', 'Onsite']

function normalize(str) {
  return (str || '').toString().toLowerCase().trim()
}

function skillMatchText(op) {
  return [...(op.required_skills || [])].join(' ')
}

function getLocationBucket(location) {
  const l = normalize(location || '')
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
  const tone = scoreBucket(opportunity.match_pct)

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
          {opportunity.match_pct}%
          <span className="match-pill-sub"> match</span>
        </div>
      </div>

      <div className="opp-desc">{opportunity.description}</div>

      <div className="opp-skills">
        <span className="opp-skills-label">Required:</span>
        <div className="tag-list">
          {(opportunity.required_skills || []).map((s) => (
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
        Required score: <b>{opportunity.required_score}%</b>
      </div>
    </div>
  )
}

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [location, setLocation] = useState('All')
  const [minMatch, setMinMatch] = useState('All')
  const [skillTag, setSkillTag] = useState('All')

  const loadOpportunities = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        type_filter: type !== 'All' ? type : null,
        location_filter: location !== 'All' ? location : null,
        min_match: minMatch !== 'All' ? Number(minMatch) : null,
        skill_filter: skillTag !== 'All' ? skillTag : null,
        search: query || null,
      }
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== ''))
      const data = await getOpportunities(cleanParams)
      setOpportunities(data || [])
    } catch (e) {
      setError(e?.message || 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }, [query, type, location, minMatch, skillTag])

  useEffect(() => {
    loadOpportunities()
  }, [loadOpportunities])

  // All filtering now performed by backend
  const allSkillTags = useMemo(() => {
    const set = new Set()
    opportunities.forEach((op) => (op.required_skills || []).forEach((s) => set.add(s)))
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [opportunities])

  const filtered = useMemo(() => {
    return opportunities  // Backend handles all filtering
  }, [opportunities])

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading opportunities…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-title">Unable to load opportunities</div>
          <p className="muted">{error}</p>
          <button className="btn btn-primary" type="button" onClick={loadOpportunities} style={{ marginTop: 16 }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Opportunities</h1>
        <p className="muted">Find roles matched to your verified skills</p>
      </div>

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
          <div className="muted">Available opportunities ({opportunities.length} total)</div>
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