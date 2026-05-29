import { useEffect, useMemo, useState } from 'react'
import { getProfile } from '../services/authService'

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Spanish']
const DASHBOARD_LANDING_OPTIONS = ['Dashboard', 'Assessments', 'Opportunities']

const LS_KEYS = {
  theme: 'skillbridge_theme',
  notifications: 'skillbridge_notifications',
  preferences: 'skillbridge_preferences',
}

function safeJsonParse(value, fallback) {
  try {
    if (!value) return fallback
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function formatMemberSince(yearLike) {
  // deterministic mock until backend provides it
  return yearLike || '2024'
}

function ToggleRow({ icon, label, description, checked, onChange }) {
  return (
    <div className="settings-row" role="group" aria-label={label}>
      <div className="settings-row-left">
        <div className="settings-row-icon" aria-hidden>
          {icon}
        </div>
        <div>
          <div className="settings-row-label">{label}</div>
          {description ? <div className="settings-row-desc">{description}</div> : null}
        </div>
      </div>

      <div className="settings-row-right">
        <label className="switch">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
          <span className="slider" />
        </label>
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="settings-field">
      <label className="label">{label}</label>
      <input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export default function Settings() {
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  const [theme, setTheme] = useState(() => localStorage.getItem(LS_KEYS.theme) || 'light')

  const [notifications, setNotifications] = useState(() =>
    safeJsonParse(localStorage.getItem(LS_KEYS.notifications), {
      emailNotifications: true,
      assessmentUpdates: true,
      opportunityAlerts: true,
      productAnnouncements: false,
    })
  )

  const [preferences, setPreferences] = useState(() =>
    safeJsonParse(localStorage.getItem(LS_KEYS.preferences), {
      language: 'English',
      dashboardLanding: 'Dashboard',
    })
  )

  const memberSince = useMemo(() => formatMemberSince('2024'), [])

  useEffect(() => {
    localStorage.setItem(LS_KEYS.theme, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(LS_KEYS.notifications, JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem(LS_KEYS.preferences, JSON.stringify(preferences))
  }, [preferences])

  useEffect(() => {
    ;(document.documentElement || document.body).classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setProfileLoading(true)
        const p = await getProfile()
        if (!cancelled) setProfile(p)
      } catch (e) {
        if (!cancelled) setProfileError(e?.message || 'Failed to load profile')
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const securityCanSave = useMemo(() => false, []) // no backend endpoint wired

  const updatePref = (patch) => setPreferences((prev) => ({ ...prev, ...patch }))

  const updateNotif = (patch) => setNotifications((prev) => ({ ...prev, ...patch }))

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="muted">Account, appearance, notifications, and security (UI only)</p>
      </div>

      {profileError ? <div className="card">{profileError}</div> : null}

      <div className="grid settings-grid">
        {/* Account */}
        <section className="card settings-card" aria-label="Account settings">
          <div className="section-title-row">
            <div>
              <div className="section-title">Account</div>
              <div className="section-subtitle">Your account details</div>
            </div>
          </div>

          <div className="settings-two-col">
            <div className="settings-field">
              <label className="label">Full Name</label>
              <div className="settings-readonly">{profile?.name ?? (profileLoading ? 'Loading…' : '—')}</div>
            </div>

            <div className="settings-field">
              <label className="label">Email</label>
              <div className="settings-readonly">{profile?.email ?? (profileLoading ? 'Loading…' : '—')}</div>
            </div>
          </div>

          <div className="settings-field" style={{ marginTop: 12 }}>
            <label className="label">Member Since</label>
            <div className="settings-readonly">{memberSince}</div>
          </div>
        </section>

        {/* Appearance */}
        <section className="card settings-card" aria-label="Appearance settings">
          <div className="section-title-row">
            <div>
              <div className="section-title">Appearance</div>
              <div className="section-subtitle">Choose how SkillBridge looks</div>
            </div>
          </div>

          <div className="settings-two-col">
            <div className="settings-field">
              <label className="label">Theme</label>
              <div className="settings-theme-toggle">
                <button
                  type="button"
                  className={theme === 'light' ? 'btn btn-primary' : 'btn btn-ghost'}
                  onClick={() => setTheme('light')}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'btn btn-primary' : 'btn btn-ghost'}
                  onClick={() => setTheme('dark')}
                >
                  🌙 Dark
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label className="label">Live Preview</label>
              <div className="muted">Theme is applied to the SaaS layout instantly.</div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="card settings-card" aria-label="Notification preferences">
          <div className="section-title-row">
            <div>
              <div className="section-title">Notifications</div>
              <div className="section-subtitle">Frontend-only preferences</div>
            </div>
          </div>

          <div className="settings-rows">
            <ToggleRow
              icon="✉️"
              label="Email Notifications"
              description="Get important updates by email"
              checked={notifications.emailNotifications}
              onChange={(v) => updateNotif({ emailNotifications: v })}
            />
            <ToggleRow
              icon="🧪"
              label="Assessment Updates"
              description="When new evaluations are ready"
              checked={notifications.assessmentUpdates}
              onChange={(v) => updateNotif({ assessmentUpdates: v })}
            />
            <ToggleRow
              icon="🎯"
              label="Opportunity Alerts"
              description="New jobs or internships matched to you"
              checked={notifications.opportunityAlerts}
              onChange={(v) => updateNotif({ opportunityAlerts: v })}
            />
            <ToggleRow
              icon="📣"
              label="Product Announcements"
              description="Beta features and platform news"
              checked={notifications.productAnnouncements}
              onChange={(v) => updateNotif({ productAnnouncements: v })}
            />
          </div>
        </section>

        {/* Security */}
        <section className="card settings-card" aria-label="Security settings">
          <div className="section-title-row">
            <div>
              <div className="section-title">Security</div>
              <div className="section-subtitle">Change password (UI only)</div>
            </div>
          </div>

          <div className="settings-security-grid">
            <TextInput
              label="Current Password"
              type="password"
              value={security.currentPassword}
              onChange={(v) => setSecurity((prev) => ({ ...prev, currentPassword: v }))}
            />
            <TextInput
              label="New Password"
              type="password"
              value={security.newPassword}
              onChange={(v) => setSecurity((prev) => ({ ...prev, newPassword: v }))}
            />
            <TextInput
              label="Confirm Password"
              type="password"
              value={security.confirmPassword}
              onChange={(v) => setSecurity((prev) => ({ ...prev, confirmPassword: v }))}
            />
          </div>

          <div className="settings-security-footer">
            <div className="muted">Save is disabled because no backend endpoint is wired for password updates.</div>
            <button className="btn btn-primary" type="button" disabled={!securityCanSave}>
              Save changes
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section className="card settings-card" aria-label="Preferences">
          <div className="section-title-row">
            <div>
              <div className="section-title">Preferences</div>
              <div className="section-subtitle">Frontend-only customization</div>
            </div>
          </div>

          <div className="settings-two-col">
            <div className="settings-field">
              <label className="label">Language</label>
              <select
                className="select"
                value={preferences.language}
                onChange={(e) => updatePref({ language: e.target.value })}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label className="label">Dashboard landing page</label>
              <select
                className="select"
                value={preferences.dashboardLanding}
                onChange={(e) => updatePref({ dashboardLanding: e.target.value })}
              >
                {DASHBOARD_LANDING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-inline-note">
            <span aria-hidden>💡</span> Navigation preference persists in localStorage.
          </div>
        </section>
      </div>
    </div>
  )
}


