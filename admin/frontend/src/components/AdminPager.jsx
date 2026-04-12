import Button from './Button'

/** עימוד פשוט לרשימות אדמין */
export default function AdminPager({ page, pages, total, loading, onPageChange, className = '' }) {
  if (!pages || pages < 1) return null
  if (pages <= 1 && (!total || total <= 0)) return null

  return (
    <div
      className={`mt-8 flex flex-wrap items-center justify-center gap-4 ${className}`}
      dir="rtl"
    >
      <Button
        type="button"
        variant="soft"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
      >
        הקודם
      </Button>
      <span className="text-sm text-neutral-600">
        עמוד {page} מתוך {pages}
        {typeof total === 'number' ? ` · ${total} רשומות` : ''}
      </span>
      <Button
        type="button"
        variant="soft"
        disabled={page >= pages || loading}
        onClick={() => onPageChange(page + 1)}
      >
        הבא
      </Button>
    </div>
  )
}
