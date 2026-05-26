export default function LoadingButton({ children, loading, ...props }) {
  return (
    <button className="loading-button" disabled={loading} {...props}>
      {loading ? <span className="button-loader">Loading…</span> : children}
    </button>
  )
}
