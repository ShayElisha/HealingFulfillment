function EmptyState({ icon = '📭', title, description, children, className = '' }) {
  return (
    <div className={`admin-empty ${className}`.trim()}>
      <div className="admin-empty-icon" aria-hidden>
        {icon}
      </div>
      {title ? <p className="admin-empty-title">{title}</p> : null}
      {description ? <p className="admin-empty-desc">{description}</p> : null}
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  )
}

export default EmptyState
