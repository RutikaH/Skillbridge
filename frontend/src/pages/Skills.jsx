import { useEffect, useMemo, useState } from 'react'
import { getProfile } from '../services/authService'
import { mockSkills } from '../data/mockSkills'

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
            {skill.level} · {skill.assessmentCount} assessments
          </div>
          <div className="skill-sub-meta">
            <span className="muted">Last evaluated:</span> {skill.lastEvaluatedDate}
          </div>
        </div>
        <div className="skill-right">
          <div className="skill-score">
            {skill.verifiedScore}
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
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')

  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('All')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('score') // score | name

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

  const filtered = useMemo(() => {
    const q = normalize(query)

    let items = [...mockSkills]

    if (verifiedOnly) items = items.filter((s) => s.verified)

    if (level !== 'All') items = items.filter((s) => s.level === level)

    if (q) items = items.filter((s) => normalize(s.name).includes(q) || normalize(s.level).includes(q))

    items.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      // score desc
      return b.verifiedScore - a.verifiedScore
    })

    return items
  }, [query, level, verifiedOnly, sortBy])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Skills</h1>
        <p className="muted">Search, verify, and track your assessment progress</p>
      </div>

      {profileError ? <div className="card">{profileError}</div> : null}

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
          <div className="muted">
            {loadingProfile ? 'Loading profile…' : `Skills for ${profile?.name ?? 'you'}`}
          </div>
          <div className="opp-result-count">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No skills found</div>
            <div className="muted">Try changing your search or filters.</div>
          </div>
        ) : (
          <div className="skills-grid">
            {filtered.map((s) => (
              <SkillCard key={s.id} skill={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


