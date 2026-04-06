function AdminModalLayout({
  title,
  onClose,
  children,
  footer,
  maxWidthClass = 'max-w-2xl',
  zIndexClass = 'z-[100]',
  closeOnBackdrop = true,
}) {
  const handleBackdrop = (e) => {
    if (!closeOnBackdrop) return
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      className={`admin-modal-backdrop ${zIndexClass}`}
      role="presentation"
      onClick={handleBackdrop}
    >
      <div
        className={`admin-modal-panel ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'admin-modal-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          {title ? (
            <h2 id="admin-modal-title" className="font-serif text-xl font-semibold text-neutral-900 md:text-2xl">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl text-neutral-500 transition-colors hover:bg-white/80 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
              aria-label="סגור"
            >
              ✕
            </button>
          ) : null}
        </div>
        <div className="admin-modal-body">{children}</div>
        {footer ? <div className="admin-modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}

export default AdminModalLayout
