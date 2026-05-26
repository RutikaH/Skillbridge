export default function InputField({ label, type = 'text', name, value, onChange, placeholder, hint, autoComplete, ...props }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <input
        className="field-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...props}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
