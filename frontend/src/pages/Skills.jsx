import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSkills } from '../services/apiService'

const levelOptions = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert']

function normalize(str) {
  return (str || '').toString().toLowerCase().trim()
}

function levelRank(level) {
  switch (level) {
    case 'Beginner':
      return 1
    case 'Intermediate':
      return 2
    case 'Advanced':
      return 3
    case 'Expert':
      return 4
    default:
      return 0
  }
}

function levelToProgress(level) {
  switch (level) {
    case 'Beginner':
      return 18
    case 'Intermediate':
      return 45
    case 'Advanced':
      return 72
    case 'Expert':
      return 92
    default:
      return 35
  }
}

function VerificationBadge({ verified }) {
  return (
    <span className={`pill pill-tone pill-${verified ? 'success' : 'warning'}`}>
      {verified ? 'Verified' : 'In progress'}
    </span>
  )
}

function SkillCard({ skill }) {
  return (
    <div className="card skill-card" role="group" aria-label={skill.name}>
      <div className="skill-head">
        <div>
          <div className="skill-name">{skill.name}</div>
          <div className="skill-level">
            {skill.level} · {skill.assessment_count} assessments
          </div>
          <div className="skill-sub-meta">
            <span className="muted">Last evaluated:</span>{' '}
            {skill.last_evaluated_date
              ? new Date(skill.last_evaluated_date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
              : 'Not yet evaluated'}
          </div>
        </div>
        <div className="skill-right">
          <div className="skill-score">
            {skill.verified_score}
            <span className="skill-score-suffix">%</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <VerificationBadge verified={skill.verified} />
          </div>
        </div>
      </div>

      <div className="skill-progress">
        <div className="progress" aria-label={`Progress for ${skill.name}`}>
          <div className="progress-fill" style={{ width: `${levelToProgress(skill.level)}%` }} />
        </div>
        <div className="skill-meta">
          <span>Beginner</span>
          <span>Intermediate</span>
          <span>Advanced</span>
          <span>Expert</span>
        </div>
      </div>
    </div>
  )
}

export default function Skills() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('All')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('score')

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        level_filter: level !== 'All' ? level : null,
        verified_only: verifiedOnly || null,
        sort_by: sortBy,
        query: query || null,
      }
      // Remove null/undefined params
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== ''))
      const data = await getSkills(cleanParams)
      setSkills(data.skills || [])
    } catch (e) {
      setError(e?.message || 'Failed to load skills')
    } finally {
      setLoading(false)
    }
  }, [query, level, verifiedOnly, sortBy])

  useEffect(() => {
    loadSkills()
  }, [loadSkills])

  // Frontend filtering is now handled by backend; skills already filtered
  const filtered = useMemo(() => {
    return skills
  }, [skills])

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading skills…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-title">Unable to load skills</div>
          <p className="muted">{error}</p>
          <button className="btn btn-primary" type="button" onClick={loadSkills} style={{ marginTop: 16 }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Skills</h1>
        <p className="muted">Search, verify, and track your assessment progress</p>
      </div>

      <div className="card opp-board">
        <div className="skills-controls">
          <div className="filter-group">
            <label className="label">Search</label>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Skill name or level"
              aria-label="Search skills"
            />
          </div>

          <div className="filter-group">
            <label className="label">Level</label>
            <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
              {levelOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="label">Sort</label>
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="score">Verified score</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="filter-group filter-check">
            <label className="label">Verified only</label>
            <label className="check">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              <span>Show verified skills only</span>
            </label>
          </div>
        </div>

        <div className="opp-board-head">
          <div className="muted">Your skills ({skills.length} total)</div>
          <div className="opp-result-count">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No skills found</div>
            <div className="muted">
              {skills.length === 0
                ? 'Complete an assessment to build your skill profile.'
                : 'Try changing your search or filters.'}
            </div>
          </div>
        ) : (
          <div className="skills-grid">
            {filtered.map((s) => (
              <SkillCard key={s.skill_id || s.id} skill={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}