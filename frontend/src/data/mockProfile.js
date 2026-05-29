export const mockProfile = {
  overallSkillScore: 89,
  assessmentsCompleted: 12,
  verifiedSkillsCount: 7,
  opportunityMatches: 6,

  preferredLanguage: 'English',
  careerInterests: ['Frontend Engineering', 'Data Analytics', 'Product Building'],

  verifiedSkills: [
    { id: 'p-sk-python', name: 'Python', score: 88, level: 'Advanced', lastAssessment: '2026-04-18' },
    { id: 'p-sk-react', name: 'React', score: 84, level: 'Advanced', lastAssessment: '2026-03-22' },
    { id: 'p-sk-sql', name: 'SQL', score: 91, level: 'Expert', lastAssessment: '2026-02-14' },
    { id: 'p-sk-js', name: 'JavaScript', score: 86, level: 'Advanced', lastAssessment: '2026-02-14' },
    { id: 'p-sk-ps', name: 'Problem Solving', score: 92, level: 'Expert', lastAssessment: '2026-04-26' },
  ],

  assessmentHistory: [
    { id: 'a-frontend-fund', name: 'Frontend Fundamentals', date: '2026-04-30', score: 84, status: 'Verified' },
    { id: 'a-python-logic', name: 'Python Logic Test', date: '2026-04-18', score: 88, status: 'Verified' },
    { id: 'a-sql-challenge', name: 'SQL Query Challenge', date: '2026-03-22', score: 91, status: 'Verified' },
    { id: 'a-react-build', name: 'React Build Sprint', date: '2026-03-10', score: 80, status: 'In review' },
  ],

  badges: [
    { id: 'b-verified-dev', title: 'Verified Developer', icon: '✅', tone: 'success' },
    { id: 'b-fast-learner', title: 'Fast Learner', icon: '⚡', tone: 'primary' },
    { id: 'b-assessment-champ', title: 'Assessment Champion', icon: '🏆', tone: 'warning' },
    { id: 'b-top-performer', title: 'Top Performer', icon: '📈', tone: 'success' },
  ],

  preferences: {
    roles: ['Frontend Developer', 'Full Stack Developer', 'Data Analyst'],
    workModes: ['Remote', 'Hybrid'],
    industries: ['SaaS', 'FinTech', 'EdTech', 'AI Tools'],
    locations: ['Bengaluru', 'Remote (Anywhere)'],
  },

  activity: [
    { id: 'act-react', text: 'Completed React Assessment', date: '2 days ago' },
    { id: 'act-python', text: 'Unlocked Python Verification', date: '4 days ago' },
    { id: 'act-opps', text: 'Viewed 5 Opportunities', date: '1 week ago' },
  ],
}

