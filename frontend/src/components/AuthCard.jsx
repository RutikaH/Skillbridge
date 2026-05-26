import { motion } from 'framer-motion'

export default function AuthCard({ title, description, children, footer }) {
  return (
    <motion.div
      className="card-shell"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="card-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </motion.div>
  )
}
