import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProfile, getPreferences, updatePreferences } from '../services/apiService'

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Spanish']
const DASHBOARD_LANDING_OPTIONS = ['Dashboard', 'Assessments', 'Opportunities']

const LS_KEYS = {
  theme: 'skillbridge_theme',
  notifications: 'skillbridge_notifications',
}

function safeJsonParse(value, fallback) {
  try {
    if (!value) return fallback
    return JSON.parse(value)
  } catch {
    return fallback
  }
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

  const [preferences, setPreferences] = useState({
    preferred_language: 'English',
    preferred_roles: [],
    preferred_work_modes: [],
    preferred_industries: [],
    preferred_locations: [],
  })
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [preferencesSaved, setPreferencesSaved] = useState(false)

  const memberSince = useMemo(() => {
    if (!profile?.user?.created_at) return '2025'
    return new Date(profile.user.created_at).getFullYear()
  }, [profile])

  useEffect(() => {
    localStorage.setItem(LS_KEYS.theme, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(LS_KEYS.notifications, JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    ; (document.documentElement || document.body).classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setProfileLoading(true)
        const p = await getProfile()
        if (!cancelled) setProfile(p)

        const prefs = await getPreferences()
        if (!cancelled) {
          setPreferences({
            preferred_language: prefs.preferred_language || 'English',
            preferred_roles: prefs.preferred_roles || [],
            preferred_work_modes: prefs.preferred_work_modes || [],
            preferred_industries: prefs.preferred_industries || [],
            preferred_locations: prefs.preferred_locations || [],
          })
        }
      } catch (e) {
        if (!cancelled) setProfileError(e?.message || 'Failed to load profile')
      } finally {
        if (!cancelled) {
          setProfileLoading(false)
          setPreferencesLoading(false)
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  const [security] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const securityCanSave = false

  const handleSavePreferences = useCallback(async () => {
    try {
      setPreferencesSaving(true)
      setPreferencesSaved(false)
      await updatePreferences(preferences)
      setPreferencesSaved(true)
      setTimeout(() => setPreferencesSaved(false), 3000)
    } catch (e) {
      setProfileError(e?.message || 'Failed to save preferences')
    } finally {
      setPreferencesSaving(false)
    }
  }, [preferences])

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="muted">Account, appearance, notifications, and preferences</p>
      </div>

      {profileError ? <div className="card field-error panel-error">{profileError}</div> : null}

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
              <div className="settings-readonly">{profile?.user?.name ?? (profileLoading ? 'Loading…' : '—')}</div>
            </div>

            <div className="settings-field">
              <label className="label">Email</label>
              <div className="settings-readonly">{profile?.user?.email ?? (profileLoading ? 'Loading…' : '—')}</div>
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
              onChange={(v) => setNotifications((prev) => ({ ...prev, emailNotifications: v }))}
            />
            <ToggleRow
              icon="🧪"
              label="Assessment Updates"
              description="When new evaluations are ready"
              checked={notifications.assessmentUpdates}
              onChange={(v) => setNotifications((prev) => ({ ...prev, assessmentUpdates: v }))}
            />
            <ToggleRow
              icon="🎯"
              label="Opportunity Alerts"
              description="New jobs or internships matched to you"
              checked={notifications.opportunityAlerts}
              onChange={(v) => setNotifications((prev) => ({ ...prev, opportunityAlerts: v }))}
            />
            <ToggleRow
              icon="📣"
              label="Product Announcements"
              description="Beta features and platform news"
              checked={notifications.productAnnouncements}
              onChange={(v) => setNotifications((prev) => ({ ...prev, productAnnouncements: v }))}
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
            <div className="settings-field">
              <label className="label">Current Password</label>
              <input
                className="input"
                type="password"
                value={security.currentPassword}
                onChange={() => { }}
                placeholder="Enter current password"
              />
            </div>
            <div className="settings-field">
              <label className="label">New Password</label>
              <input
                className="input"
                type="password"
                value={security.newPassword}
                onChange={() => { }}
                placeholder="Enter new password"
              />
            </div>
            <div className="settings-field">
              <label className="label">Confirm Password</label>
              <input
                className="input"
                type="password"
                value={security.confirmPassword}
                onChange={() => { }}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="settings-security-footer">
            <div className="muted">Save is disabled because no backend endpoint is wired for password updates.</div>
            <button className="btn btn-primary" type="button" disabled={!securityCanSave}>
              Save changes
            </button>
          </div>
        </section>

        {/* Preferences - Now Persisted to Backend */}
        <section className="card settings-card" aria-label="Preferences">
          <div className="section-title-row">
            <div>
              <div className="section-title">Preferences</div>
              <div className="section-subtitle">Customize your experience (persisted to database)</div>
            </div>
          </div>

          {preferencesLoading ? (
            <div className="muted">Loading preferences…</div>
          ) : (
            <>
              <div className="settings-two-col">
                <div className="settings-field">
                  <label className="label">Language</label>
                  <select
                    className="select"
                    value={preferences.preferred_language}
                    onChange={(e) => setPreferences((prev) => ({ ...prev, preferred_language: e.target.value }))}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="settings-field">
                  <label className="label">Preferred Roles</label>
                  <input
                    className="input"
                    value={(preferences.preferred_roles || []).join(', ')}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferred_roles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="e.g. Frontend Developer, Data Analyst"
                  />
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Comma-separated list of roles
                  </div>
                </div>
              </div>

              <div className="settings-two-col" style={{ marginTop: 12 }}>
                <div className="settings-field">
                  <label className="label">Work Modes</label>
                  <input
                    className="input"
                    value={(preferences.preferred_work_modes || []).join(', ')}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferred_work_modes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="e.g. Remote, Hybrid"
                  />
                </div>

                <div className="settings-field">
                  <label className="label">Industries</label>
                  <input
                    className="input"
                    value={(preferences.preferred_industries || []).join(', ')}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferred_industries: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="e.g. SaaS, FinTech"
                  />
                </div>
              </div>

              <div className="settings-field" style={{ marginTop: 12 }}>
                <label className="label">Preferred Locations</label>
                <input
                  className="input"
                  value={(preferences.preferred_locations || []).join(', ')}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      preferred_locations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    }))
                  }
                  placeholder="e.g. Bengaluru, Remote (Anywhere)"
                />
              </div>

              <div className="settings-security-footer" style={{ marginTop: 16 }}>
                <div className="muted">
                  {preferencesSaved
                    ? '✅ Preferences saved to database successfully.'
                    : 'Preferences are stored in the database and persist across sessions.'}
                </div>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={preferencesSaving}
                >
                  {preferencesSaving ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}