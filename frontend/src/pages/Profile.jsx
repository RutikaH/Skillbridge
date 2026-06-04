import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProfile, getBadges, getPreferences } from '../services/apiService'

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'S'
  const first = parts[0]?.[0] || 'S'
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  return (first + last).toUpperCase()
}

function formatDate(dateLike) {
  if (!dateLike) return '—'
  return new Date(dateLike).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
        <div className="timeline-title">{item.assessment_name || 'Assessment'}</div>
        <div className="timeline-meta">
          <span className="timeline-date">{formatDate(item.created_at)}</span>
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
  const [profileData, setProfileData] = useState(null)
  const [badges, setBadges] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [profile, badgeData, prefData] = await Promise.all([
        getProfile(),
        getBadges(),
        getPreferences(),
      ])
      setProfileData(profile)
      setBadges(badgeData || [])
      setPreferences(prefData)
    } catch (e) {
      setError(e?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const user = useMemo(() => profileData?.user, [profileData])
  const avatarText = useMemo(() => initials(user?.name), [user?.name])
  const memberSince = useMemo(() => {
    if (!user?.created_at) return '2025'
    return new Date(user.created_at).getFullYear()
  }, [user])

  const skills = useMemo(() => profileData?.skills || [], [profileData])
  const assessmentHistory = useMemo(() => profileData?.assessment_history || [], [profileData])
  const activities = useMemo(() => profileData?.recent_activities || [], [profileData])

  const overallSkillScore = profileData?.overall_skill_score || 0
  const assessmentsCompleted = profileData?.assessments_completed || 0
  const verifiedSkillsCount = profileData?.verified_skills_count || 0
  const opportunityMatches = profileData?.opportunity_matches || 0

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading profile…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-title">Unable to load profile</div>
          <p className="muted">{error}</p>
          <button className="btn btn-primary" type="button" onClick={loadProfile} style={{ marginTop: 16 }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
        <p className="muted">Your verified skill passport</p>
      </div>

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
                <span className="pill pill-small pill-tone pill-primary">
                  Preferred: {preferences?.preferred_language || 'English'}
                </span>
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
            <div className="kpi-value">{overallSkillScore}%</div>
            <div className="kpi-sub">Based on verified skill assessments</div>
          </div>

          <div className="kpi-card">
            <div className="section-title">Assessments Completed</div>
            <div className="kpi-value">{assessmentsCompleted}</div>
            <div className="kpi-sub">Total evaluations submitted</div>
          </div>

          <div className="kpi-card">
            <div className="section-title">Verified Skills</div>
            <div className="kpi-value">{verifiedSkillsCount}</div>
            <div className="kpi-sub">Credibility boost for employers</div>
          </div>

          <div className="kpi-card">
            <div className="section-title">Opportunity Matches</div>
            <div className="kpi-value">{opportunityMatches}</div>
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

            {skills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No verified skills yet</div>
                <div className="muted">Complete an assessment to get your first verified skill.</div>
              </div>
            ) : (
              <div className="skills-grid">
                {skills.map((s) => (
                  <div key={s.skill_id || s.id} className="skill-compact">
                    <div className="skill-compact-left">
                      <div className="skill-compact-name">{s.name}</div>
                      <div className="skill-compact-level">{s.level}</div>
                    </div>
                    <div className="skill-compact-right">
                      <div className="skill-compact-score">
                        {s.verified_score}
                        <span className="skill-score-suffix">%</span>
                      </div>
                      <div className="pill pill-small pill-success">Verified</div>
                    </div>
                    <div className="skill-compact-foot">
                      Last assessment:{' '}
                      <b>{s.last_evaluated_date ? formatDate(s.last_evaluated_date) : 'N/A'}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card profile-section">
            <div className="section-title-row">
              <div>
                <div className="section-title">Assessment History</div>
                <div className="muted">Timeline of your skill evaluations</div>
              </div>
            </div>

            {assessmentHistory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No assessments yet</div>
                <div className="muted">Start an assessment to build your history.</div>
              </div>
            ) : (
              <div className="timeline">
                {assessmentHistory.map((it) => (
                  <TimelineItem key={it.id} item={it} />
                ))}
              </div>
            )}
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

            {badges.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No badges yet</div>
                <div className="muted">Complete assessments to earn badges.</div>
              </div>
            ) : (
              <div className="badge-grid">
                {badges.map((b) => (
                  <Badge key={b.id} icon={b.icon} title={b.title} tone={b.tone} />
                ))}
              </div>
            )}
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
                  {(preferences?.preferred_roles || []).length === 0 ? (
                    <span className="muted">Not set</span>
                  ) : (
                    (preferences?.preferred_roles || []).map((r) => (
                      <span key={r} className="pill pill-small pill-type">
                        {r}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="kv-row">
                <div className="kv-k">Work Mode</div>
                <div className="kv-v">
                  {(preferences?.preferred_work_modes || []).length === 0 ? (
                    <span className="muted">Not set</span>
                  ) : (
                    (preferences?.preferred_work_modes || []).map((m) => (
                      <span key={m} className="pill pill-small pill-tone pill-primary">
                        {m}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="kv-row">
                <div className="kv-k">Industries</div>
                <div className="kv-v">
                  {(preferences?.preferred_industries || []).length === 0 ? (
                    <span className="muted">Not set</span>
                  ) : (
                    (preferences?.preferred_industries || []).map((i) => (
                      <span key={i} className="pill pill-small pill-tone pill-primary">
                        {i}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="kv-row">
                <div className="kv-k">Preferred Locations</div>
                <div className="kv-v">
                  {(preferences?.preferred_locations || []).length === 0 ? (
                    <span className="muted">Not set</span>
                  ) : (
                    (preferences?.preferred_locations || []).map((l) => (
                      <span key={l} className="pill pill-small pill-tone pill-primary">
                        {l}
                      </span>
                    ))
                  )}
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

            {activities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No recent activity</div>
                <div className="muted">Your activity will appear here.</div>
              </div>
            ) : (
              <div className="activity-mini">
                {activities.map((a) => (
                  <div key={a.id} className="activity-mini-item">
                    <div className="activity-mini-icon" aria-hidden>
                      ✨
                    </div>
                    <div>
                      <div className="activity-mini-text">{a.title}</div>
                      <div className="activity-mini-date">
                        {a.created_at ? formatDate(a.created_at) : 'Recently'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    </div>
  )
}