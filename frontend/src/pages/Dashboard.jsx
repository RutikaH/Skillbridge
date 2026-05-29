import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile } from '../services/authService'

const skillsMock = [
  { name: 'Python', score: 82, level: 'Advanced' },
  { name: 'React', score: 68, level: 'Intermediate' },
  { name: 'SQL', score: 61, level: 'Intermediate' },
]

const activityMock = [
  { title: 'Assessment submitted', detail: 'Skill Test — Python', date: 'Today' },
  { title: 'Evaluation completed', detail: 'Verified score posted to your profile', date: 'Yesterday' },
  { title: 'New skill unlocked', detail: 'React — Intermediate level', date: '2 days ago' },
]

const opportunitiesMock = [
  {
    role: 'Frontend Intern',
    company: 'NovaWorks',
    type: 'Internship',
    location: 'Bengaluru',
    requiredSkills: 'React, JavaScript',
    matchPct: 86,
    description: 'Build UI features and collaborate with the design + engineering teams.',
  },
  {
    role: 'Data Analyst (Entry)',
    company: 'Pulse Analytics',
    type: 'Job',
    location: 'Remote',
    requiredSkills: 'SQL, Python',
    matchPct: 79,
    description: 'Turn raw data into actionable insights and dashboards.',
  },
]

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

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'S'
  const first = parts[0]?.[0] || 'S'
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  return (first + last).toUpperCase()
}

function StatCard({ icon, label, value, sublabel }) {
  return (
    <div className="kpi-card" role="group" aria-label={label}>
      <div className="kpi-top">
        <div className="kpi-icon" aria-hidden>
          {icon}
        </div>
        <div className="kpi-label">{label}</div>
      </div>
      <div className="kpi-value">{value}</div>
      {sublabel ? <div className="kpi-sub">{sublabel}</div> : null}
    </div>
  )
}

function ProgressBar({ value }) {
  return (
    <div className="progress" aria-label={`Progress ${value}%`}>
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  )
}

function SkillProgressCard({ name, score, level }) {
  return (
    <div className="card skill-card" role="group" aria-label={`Skill ${name}`}>
      <div className="skill-head">
        <div>
          <div className="skill-name">{name}</div>
          <div className="skill-level">{level}</div>
        </div>
        <div className="skill-score">
          {score}
          <span className="skill-score-suffix">%</span>
        </div>
      </div>
      <div className="skill-progress">
        <ProgressBar value={levelToProgress(level)} />
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

function ActivityItem({ title, detail, date }) {
  return (
    <div className="activity-item">
      <div className="activity-dot" aria-hidden />
      <div className="activity-content">
        <div className="activity-title">{title}</div>
        <div className="activity-detail">{detail}</div>
        <div className="activity-date">{date}</div>
      </div>
    </div>
  )
}

function OpportunityCard({ role, company, location, requiredSkills, matchPct, description }) {
  return (
    <div className="card opp-card" role="group" aria-label={`Opportunity ${role}`}>
      <div className="opp-top">
        <div>
          <div className="opp-role">{role}</div>
          <div className="opp-company">
            {company} · {location}
          </div>
        </div>
        <div className="match-pill" title="Match percentage">
          {matchPct}%
          <span className="match-pill-sub"> match</span>
        </div>
      </div>
      <div className="opp-desc">{description}</div>
      <div className="opp-skills">
        <span className="opp-skills-label">Required:</span> {requiredSkills}
      </div>
      <div className="opp-actions">
        <button className="btn btn-primary" type="button">
          Apply
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')

  const userName = useMemo(() => profile?.name, [profile])
  const avatarInitials = useMemo(() => initials(userName), [userName])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoadingProfile(true)
        setProfileError('')
        const p = await getProfile()
        if (!cancelled) setProfile(p)
      } catch (e) {
        if (!cancelled) setProfileError(e?.message || 'Unable to load profile')
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const welcomeLine = loadingProfile
    ? 'Welcome back…'
    : userName
      ? `Welcome back, ${userName} 👋`
      : 'Welcome back 👋'

  const kpis = useMemo(
    () => [
      { icon: '✅', label: 'Verified Skills', value: '3', sublabel: 'Ready to prove' },
      { icon: '📈', label: 'Average Skill Score', value: '70%', sublabel: 'Across assessments' },
      { icon: '🧪', label: 'Assessments Completed', value: '4', sublabel: 'Latest evaluated' },
      { icon: '🎯', label: 'Opportunity Matches', value: '5', sublabel: 'Based on scores' },
    ],
    []
  )

  return (
    <div className="page">
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="hero-badge">Skill-based hiring · Verified capabilities</div>
          <h1 className="hero-title">{welcomeLine}</h1>
          <p className="hero-subtitle">Get hired for your skills, not your degree.</p>

          <div className="hero-progress-row" aria-label="Your progress summary">
            <div className="hero-progress-item">
              <div className="hero-progress-k">{kpis[0].value}</div>
              <div className="hero-progress-l">Verified skills</div>
            </div>
            <div className="hero-progress-sep" aria-hidden />
            <div className="hero-progress-item">
              <div className="hero-progress-k">{kpis[2].value}</div>
              <div className="hero-progress-l">Assessments completed</div>
            </div>
            <div className="hero-progress-sep" aria-hidden />
            <div className="hero-progress-item">
              <div className="hero-progress-k">{kpis[3].value}</div>
              <div className="hero-progress-l">Opportunity matches</div>
            </div>
          </div>

          {profileError ? <div className="field-error panel-error hero-error">{profileError}</div> : null}

          <div className="hero-actions">
            <button className="btn btn-primary" type="button" onClick={() => navigate('/assessments')}>
              Start Assessment
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => navigate('/opportunities')}>
              View Opportunities
            </button>
          </div>

          <div className="hero-mission">
            <div className="mission-point">• Skill-based hiring</div>
            <div className="mission-point">• Verified capabilities</div>
            <div className="mission-point">• Inclusive opportunities</div>
          </div>
        </div>

        <div className="dash-hero-right" aria-label="Profile quick card">
          <div className="profile-quick">
            <div className="profile-quick-avatar" aria-hidden>
              {avatarInitials}
            </div>
            <div>
              <div className="profile-quick-name">{userName || 'Candidate'}</div>
              <div className="profile-quick-sub">Your verified score story</div>
            </div>
          </div>

          <div className="kpi-grid">
            {kpis.map((k) => (
              <div key={k.label} className="kpi-grid-item">
                <StatCard icon={k.icon} label={k.label} value={k.value} sublabel={k.sublabel} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title-row">
          <div>
            <div className="section-title">Skill Progress</div>
            <div className="section-subtitle">Top verified skills with your current assessment momentum.</div>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => navigate('/skills')}>
            Manage Skills
          </button>
        </div>

        <div className="skills-grid">
          {skillsMock.map((s) => (
            <SkillProgressCard key={s.name} name={s.name} score={s.score} level={s.level} />
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title-row">
          <div>
            <div className="section-title">Recent Activity</div>
            <div className="section-subtitle">Updates from your assessments and verified profile milestones.</div>
          </div>
        </div>

        <div className="activity-list">
          {activityMock.map((a) => (
            <ActivityItem key={a.title + a.detail} title={a.title} detail={a.detail} date={a.date} />
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title-row">
          <div>
            <div className="section-title">Recommended Opportunities</div>
            <div className="section-subtitle">Matches based on skills and verified scores.</div>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => navigate('/opportunities')}>
            See all
          </button>
        </div>

        <div className="opps-grid">
          {opportunitiesMock.map((o) => (
            <OpportunityCard
              key={o.role + o.company}
              role={o.role}
              company={o.company}
              location={o.location}
              requiredSkills={o.requiredSkills}
              matchPct={o.matchPct}
              description={o.description}
            />
          ))}
        </div>
      </div>
    </div>
  )
}


