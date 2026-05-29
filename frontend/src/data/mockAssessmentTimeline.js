export const mockAssessmentTimeline = {
  currentProgress: {
    currentStep: 'Skill Evaluation',
    completionPct: 62,
    status: 'In progress',
  },
  stats: {
    assessmentsCompleted: 12,
    averageScore: 81,
    skillsVerified: 7,
    bestScore: 94,
    totalAssessments: 12,
    verifiedEarned: 7,
  },
  recentResults: [
    { name: 'Python Fundamentals', score: 82, status: 'Verified', date: '2026-04-30' },
    { name: 'React Basics', score: 74, status: 'Verified', date: '2026-04-10' },
    { name: 'SQL Challenge', score: 91, status: 'Verified', date: '2026-03-18' },
  ],
  timeline: [
    { id: 't1', name: 'Python Fundamentals', date: '2026-04-30', score: 82, status: 'Verified' },
    { id: 't2', name: 'React Basics', date: '2026-04-10', score: 74, status: 'Verified' },
    { id: 't3', name: 'SQL Challenge', date: '2026-03-18', score: 91, status: 'Verified' },
    { id: 't4', name: 'Problem Solving Sprint', date: '2026-03-01', score: 79, status: 'In review' },
  ],
  skillsEarned: [
    { id: 's1', name: 'Python', score: 82, level: 'Advanced', verified: true },
    { id: 's2', name: 'React', score: 74, level: 'Intermediate', verified: true },
    { id: 's3', name: 'SQL', score: 91, level: 'Expert', verified: true },
  ],
}

