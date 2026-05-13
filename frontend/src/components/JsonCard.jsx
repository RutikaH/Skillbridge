/**
 * JsonCard — renders the structured JSON payloads from SkillBridge AI
 * Handles:
 *   - Evaluation:      { score, strengths, improvements }
 *   - Projects:        [ { title, description, steps, real_world_use } ]
 *   - Show-your-work:  { project, what_user_did, skills_shown, confidence_score }
 *   - Job matches:     [ { role, reason } ]
 */

function ConfidenceBadge({ value }) {
  const level = String(value).toLowerCase()
  const cls = level === 'high' ? 'confidence-high'
            : level === 'medium' ? 'confidence-medium'
            : 'confidence-low'
  return <span className={`confidence ${cls}`}>{value}</span>
}

function TagList({ items, color }) {
  return (
    <div className="json-tag-list">
      {items.map((item, i) => (
        <span key={i} className={`tag-${color}`}>{item}</span>
      ))}
    </div>
  )
}

function EvaluationCard({ data }) {
  return (
    <div className="json-card">
      <div className="json-card-header">📊 Skill Evaluation</div>
      <div className="json-card-body">
        <div className="json-row">
          <span className="json-key">Score</span>
          <span className="json-val-score">{data.score} / 10</span>
        </div>
        {data.strengths?.length > 0 && (
          <div className="json-row">
            <span className="json-key">✅ Strengths</span>
            <TagList items={data.strengths} color="green" />
          </div>
        )}
        {data.improvements?.length > 0 && (
          <div className="json-row">
            <span className="json-key">🔧 To Improve</span>
            <TagList items={data.improvements} color="orange" />
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ project, index }) {
  // Normalize steps: support both `steps: [string]` and `project_steps: [{step, description}]`
  const steps = project.steps ?? (Array.isArray(project.project_steps)
    ? project.project_steps.map(p => (typeof p === 'string' ? p : p.description ?? p.desc ?? JSON.stringify(p)))
    : [])

  const skills = project.skills_required ?? project.skills ?? []

  return (
    <div className="project-card">
      <div className="project-title">
        {index != null ? `${index + 1}. ` : ''}{project.title ?? project.name}
      </div>
      {project.description && (
        <div className="project-desc">{project.description}</div>
      )}

      {skills?.length > 0 && (
        <div className="project-row">
          <span className="json-key">Skills</span>
          <TagList items={skills} color="blue" />
        </div>
      )}

      {steps.length > 0 && (
        <ol className="project-steps">
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}

      {project.real_world_use && (
        <div className="project-use">💡 {project.real_world_use}</div>
      )}
    </div>
  )
}

function ProjectsCard({ data }) {
  return (
    <div className="json-card">
      <div className="json-card-header">🚀 Step 4 — Choose a Project</div>
      <div className="json-card-body">
        <div className="project-cards">
          {data.map((p, i) => <ProjectCard key={i} project={p} index={i} />)}
        </div>
        <p className="project-pick-prompt">Which project would you like to build? (1 or 2)</p>
      </div>
    </div>
  )
}

function SummaryCard({ data }) {
  return (
    <div className="json-card">
      <div className="json-card-header">📋 Build Summary</div>
      <div className="json-card-body">
        {data.project && (
          <div className="json-row">
            <span className="json-key">Project</span>
            <span className="json-val">{data.project}</span>
          </div>
        )}
        {data.what_user_did && (
          <div className="json-row">
            <span className="json-key">What You Did</span>
            <span className="json-val">{data.what_user_did}</span>
          </div>
        )}
        {data.skills_shown?.length > 0 && (
          <div className="json-row">
            <span className="json-key">Skills Shown</span>
            <TagList items={data.skills_shown} color="blue" />
          </div>
        )}
        {data.confidence_score && (
          <div className="json-row">
            <span className="json-key">Confidence</span>
            <div style={{ marginTop: 4 }}>
              <ConfidenceBadge value={data.confidence_score} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function JobMatchCard({ data }) {
  return (
    <div className="json-card">
      <div className="json-card-header">💼 Job Opportunities</div>
      <div className="json-card-body">
        <div className="job-cards">
          {data.map((job, i) => (
            <div key={i} className="job-card">
              <div className="job-role">🏷 {job.role}</div>
              <div className="job-reason">{job.reason}</div>
              {job.skills_matched?.length > 0 && (
                <TagList items={job.skills_matched} color="blue" />
              )}
              {job.search_link && (
                <a
                  href={job.search_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="job-link"
                >
                  🔗 Apply / Search
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function JsonCard({ data }) {
  if (!data) return null

  // Detect type by shape

  // Evaluation: { score, strengths, improvements }
  if (!Array.isArray(data) && typeof data.score === 'number') {
    return <EvaluationCard data={data} />
  }

  // Show-your-work: { project, what_user_did, skills_shown, confidence_score }
  if (!Array.isArray(data) && data.what_user_did !== undefined) {
    return <SummaryCard data={data} />
  }

  // Projects array: support both `{ steps: [...] }` and legacy `{ project_steps: [...] }`
  if (Array.isArray(data) && data.length > 0 && data[0].title !== undefined && (data[0].steps !== undefined || data[0].project_steps !== undefined || data[0].description !== undefined)) {
    return <ProjectsCard data={data} />
  }

  // Job matches: [ { role, reason } ]
  if (Array.isArray(data) && data.length > 0 && data[0].role !== undefined) {
    return <JobMatchCard data={data} />
  }

  // Generic fallback
  return (
    <div className="json-card">
      <div className="json-card-header">📦 Data</div>
      <div className="json-card-body">
        <pre style={{ fontSize: 12, color: '#bfdbfe', overflowX: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
