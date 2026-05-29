import { useEffect, useMemo, useState } from 'react'
import { getProfile } from '../services/authService'
import { mockProfile } from '../data/mockProfile'

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'S'
  const first = parts[0]?.[0] || 'S'
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  return (first + last).toUpperCase()
}

function formatMemberSince(dateLike) {
  // mockProfile doesn't include memberSince; show a nice fixed placeholder.
  // Keep it deterministic.
  return dateLike || '2024'
}

function Badge({ icon, title, tone }) {
  return (
    <div className={`badge-card badge-${tone}`} role="group" aria-label={title}>
      <div className="badge-icon" aria-hidden>
        {icon}
      </div>
      <div className="badge-title">{title}</div>
    </div>
  )
}

function TimelineItem({ item }) {
  return (
    <div className="timeline-item">
      <div className="timeline-dot" aria-hidden />
      <div className="timeline-content">
        <div className="timeline-title">{item.name}</div>
        <div className="timeline-meta">
          <span className="timeline-date">{item.date}</span>
          <span className={`pill pill-small pill-tone-${item.status === 'Verified' ? 'success' : 'warning'}`}>
            {item.status}
          </span>
        </div>
        <div className="timeline-score">
          Score: <b>{item.score}</b>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const profile = await getProfile()
        if (!cancelled) setUser(profile)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const avatarText = useMemo(() => initials(user?.name), [user?.name])
  const memberSince = useMemo(() => formatMemberSince(mockProfile.memberSince), [])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
        <p className="muted">Your verified skill passport</p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {loading ? (
        <div className="card">Loading…</div>
      ) : (
        <>
          {/* Header */}
          <div className="card profile-hero">
            <div className="profile-hero-left">
              <div className="profile-avatar" aria-hidden>
                {avatarText}
              </div>
              <div>
                <div className="profile-name">{user?.name ?? '—'}</div>
                <div className="profile-email">{user?.email ?? '—'}</div>
                <div className="profile-meta-row">
                  <span className="pill pill-small pill-type">Member since {memberSince}</span>
                  <span className="pill pill-small pill-tone pill-success">Verified profile</span>
                  <span className="pill pill-small pill-tone pill-primary">Preferred: {mockProfile.preferredLanguage}</span>
                </div>
              </div>
            </div>

            <div className="profile-hero-actions">
              <button className="btn btn-primary" type="button">
                Edit Profile
              </button>
              <button className="btn btn-ghost" type="button">
                Share Profile
              </button>
            </div>
          </div>

          {/* Featured KPIs */}
          <div className="kpi-grid profile-kpis">
            <div className="kpi-card">
              <div className="section-title">Overall Skill Score</div>
              <div className="kpi-value">{mockProfile.overallSkillScore}%</div>
              <div className="kpi-sub">Based on verified skill assessments</div>
            </div>

            <div className="kpi-card">
              <div className="section-title">Assessments Completed</div>
              <div className="kpi-value">{mockProfile.assessmentsCompleted}</div>
              <div className="kpi-sub">Total evaluations submitted</div>
            </div>

            <div className="kpi-card">
              <div className="section-title">Verified Skills</div>
              <div className="kpi-value">{mockProfile.verifiedSkillsCount}</div>
              <div className="kpi-sub">Credibility boost for employers</div>
            </div>

            <div className="kpi-card">
              <div className="section-title">Opportunity Matches</div>
              <div className="kpi-value">{mockProfile.opportunityMatches}</div>
              <div className="kpi-sub">Based on your verified scores</div>
            </div>
          </div>

          {/* Verified Skills + Score history */}
          <div className="grid profile-grid">
            <div className="card profile-section">
              <div className="section-title-row">
                <div>
                  <div className="section-title">Verified Skills</div>
                  <div className="muted">Signals to prove your abilities</div>
                </div>
              </div>

              <div className="skills-grid">
                {mockProfile.verifiedSkills.map((s) => (
                  <div key={s.id} className="skill-compact">
                    <div className="skill-compact-left">
                      <div className="skill-compact-name">{s.name}</div>
                      <div className="skill-compact-level">{s.level}</div>
                    </div>
                    <div className="skill-compact-right">
                      <div className="skill-compact-score">
                        {s.score}
                        <span className="skill-score-suffix">%</span>
                      </div>
                      <div className="pill pill-small pill-success">Verified</div>
                    </div>
                    <div className="skill-compact-foot">
                      Last assessment: <b>{s.lastAssessment}</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card profile-section">
              <div className="section-title-row">
                <div>
                  <div className="section-title">Assessment History</div>
                  <div className="muted">Timeline of your skill evaluations</div>
                </div>
              </div>

              <div className="timeline">
                {mockProfile.assessmentHistory.map((it) => (
                  <TimelineItem key={it.id} item={it} />
                ))}
              </div>
            </div>
          </div>

          {/* Badges + Preferences + Activity */}
          <div className="grid profile-grid-2">
            <div className="card profile-section">
              <div className="section-title-row">
                <div>
                  <div className="section-title">Achievement Badges</div>
                  <div className="muted">Milestones built through assessments</div>
                </div>
              </div>

              <div className="badge-grid">
                {mockProfile.badges.map((b) => (
                  <Badge key={b.id} icon={b.icon} title={b.title} tone={b.tone} />
                ))}
              </div>
            </div>

            <div className="card profile-section">
              <div className="section-title-row">
                <div>
                  <div className="section-title">Career Preferences</div>
                  <div className="muted">What opportunities fit you best</div>
                </div>
              </div>

              <div className="kv-grid">
                <div className="kv-row">
                  <div className="kv-k">Preferred Roles</div>
                  <div className="kv-v">
                    {mockProfile.preferences.roles.map((r) => (
                      <span key={r} className="pill pill-small pill-type">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="kv-row">
                  <div className="kv-k">Work Mode</div>
                  <div className="kv-v">
                    {mockProfile.preferences.workModes.map((m) => (
                      <span key={m} className="pill pill-small pill-tone pill-primary">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="kv-row">
                  <div className="kv-k">Industries</div>
                  <div className="kv-v">
                    {mockProfile.preferences.industries.map((i) => (
                      <span key={i} className="pill pill-small pill-tone pill-primary">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="kv-row">
                  <div className="kv-k">Preferred Locations</div>
                  <div className="kv-v">
                    {mockProfile.preferences.locations.map((l) => (
                      <span key={l} className="pill pill-small pill-tone pill-primary">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="card profile-section">
              <div className="section-title-row">
                <div>
                  <div className="section-title">Recent Activity</div>
                  <div className="muted">Your latest SkillBridge actions</div>
                </div>
              </div>

              <div className="activity-mini">
                {mockProfile.activity.map((a) => (
                  <div key={a.id} className="activity-mini-item">
                    <div className="activity-mini-icon" aria-hidden>
                      ✨
                    </div>
                    <div>
                      <div className="activity-mini-text">{a.text}</div>
                      <div className="activity-mini-date">{a.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


