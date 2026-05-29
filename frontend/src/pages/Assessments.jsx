import AssessmentChatbot from '../components/AssessmentChatbot'

export default function Assessments() {
  return (
    <div className="page assessments-page">
      {/*
        Intentionally keep the page chrome minimal.
        The main UI focus is the dedicated assessment workspace card.
      */}
      <AssessmentChatbot />
    </div>
  )
}




