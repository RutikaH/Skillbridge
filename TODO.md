# TODO - SkillBridge UI Redesign (Assessments Hub)

## Step 1: Inspect current Assessments UI
- [x] Read `frontend/src/pages/Assessments.jsx`
- [x] Read `frontend/src/components/AssessmentChatbot.jsx`
- [ ] Determine required CSS updates

## Step 2: Redesign Assessments page UI (UI-only)
- [ ] Create two-column layout: chatbot left (70%), sidebar right (30%)
- [ ] Add header: current assessment session status + progress indicator
- [ ] Add sidebar cards: Current Progress, Assessment Statistics, Recent Results, Tips (mock data)
- [ ] Add KPI cards + Assessment Timeline + Skill Verification section below chatbot
- [ ] Add explicit "Mock data" labels where backend APIs aren’t available

## Step 3: Keep chatbot logic untouched
- [x] Do not modify backend routes
- [x] Do not modify `/start` `/chat` session handling
- [x] Keep language handling unchanged

## Step 4: Styling + responsiveness
- [ ] Add/extend CSS in `frontend/src/App.css` for the new Assessments hub
- [ ] Ensure responsive behavior on mobile

## Step 5: Validate
- [ ] Run `npm run build`
- [ ] List modified files
- [ ] Provide screenshot of Profile page (if possible) and Assessments hub after build
