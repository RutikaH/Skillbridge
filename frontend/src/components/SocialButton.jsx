export default function SocialButton({ children, onClick, icon, className = '', ...props }) {
  return (
    <button className={`social-button ${className}`} type="button" onClick={onClick} {...props}>
      {icon && <span className="social-icon">{icon}</span>}
      {children}
    </button>
  )
}
