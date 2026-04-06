import { Link } from 'react-router-dom'

function PageHeader({
  title,
  subtitle,
  backTo = '/categories',
  backLabel = 'חזור לניהול',
  actions
}) {
  return (
    <header className="admin-page-header mb-8 md:mb-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3 min-w-0">
          {backTo ? (
            <Link to={backTo} className="admin-back-link inline-flex items-center gap-2">
              <span className="text-lg leading-none opacity-80" aria-hidden>
                ←
              </span>
              {backLabel}
            </Link>
          ) : null}
          <div>
            {title ? <h1 className="admin-page-title">{title}</h1> : null}
            {subtitle ? <p className="admin-page-subtitle mt-2 md:mt-3">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

export default PageHeader
