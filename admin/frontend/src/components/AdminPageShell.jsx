function AdminPageShell({ children, className = '' }) {
  return (
    <main className={`admin-page-main min-h-screen ${className}`}>
      <div className="admin-page-noise" aria-hidden="true" />
      <div className="admin-inner relative z-[1]">{children}</div>
    </main>
  )
}

export default AdminPageShell
