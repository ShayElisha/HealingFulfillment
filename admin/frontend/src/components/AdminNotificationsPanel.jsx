import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const KIND_META = {
  booking: { icon: '📅', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  contact: { icon: '📧', color: 'bg-amber-50 text-amber-900 border-amber-200' },
  lead: { icon: '📋', color: 'bg-violet-50 text-violet-900 border-violet-200' },
  review: { icon: '⭐', color: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
  purchase: { icon: '💰', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  customer: { icon: '👤', color: 'bg-primary-50 text-primary-900 border-primary-200' },
  trigger_journal: { icon: '📝', color: 'bg-rose-50 text-rose-900 border-rose-200' },
}

function formatWhen(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function computePopoverStyle(anchorEl) {
  if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') return null
  const r = anchorEl.getBoundingClientRect()
  const margin = 8
  const panelW = Math.min(360, window.innerWidth - margin * 2)
  const maxH = Math.min(340, window.innerHeight - margin * 2)

  let left = r.left
  if (left + panelW > window.innerWidth - margin) {
    left = window.innerWidth - panelW - margin
  }
  if (left < margin) left = margin

  let top = r.bottom + 6
  const spaceBelow = window.innerHeight - top - margin
  if (spaceBelow < 100 && r.top > maxH + margin) {
    top = Math.max(margin, r.top - maxH - 6)
  } else if (top + maxH > window.innerHeight - margin) {
    top = Math.max(margin, window.innerHeight - maxH - margin)
  }

  return { top, left, width: panelW, maxHeight: maxH }
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {HTMLElement | null} props.anchorEl
 * @param {() => void} props.onClose
 * @param {(kind: string, activityId: string) => Promise<void>} [props.onMarkRead]
 * @param {() => Promise<void>} [props.onMarkAllRead]
 * @param {Array<{ id: string, kind: string, title: string, subtitle?: string, createdAt: string, href: string, isRead?: boolean }>} props.items
 * @param {boolean} props.loading
 */
export default function AdminNotificationsPanel({ open, anchorEl, onClose, onMarkRead, onMarkAllRead, items, loading }) {
  const navigate = useNavigate()
  const [boundsTick, setBoundsTick] = useState(0)
  const [markingKey, setMarkingKey] = useState(null)
  const [markAllBusy, setMarkAllBusy] = useState(false)

  useLayoutEffect(() => {
    if (!open || !anchorEl) return undefined
    const tick = () => setBoundsTick((n) => n + 1)
    tick()
    window.addEventListener('scroll', tick, true)
    window.addEventListener('resize', tick)
    return () => {
      window.removeEventListener('scroll', tick, true)
      window.removeEventListener('resize', tick)
    }
  }, [open, anchorEl])

  const style = useMemo(() => {
    if (!open || !anchorEl) return null
    return computePopoverStyle(anchorEl)
  }, [open, anchorEl, boundsTick, items?.length, loading])

  const displayItems = useMemo(() => {
    if (!Array.isArray(items) || !items.length) return []
    const sorted = [...items].sort((a, b) => {
      const ar = Boolean(a.isRead)
      const br = Boolean(b.isRead)
      if (ar !== br) return ar ? 1 : -1
      const ta = new Date(a.createdAt).getTime() || 0
      const tb = new Date(b.createdAt).getTime() || 0
      return tb - ta
    })
    return sorted.slice(0, 40)
  }, [items])

  const unreadCount = useMemo(
    () => (Array.isArray(items) ? items.filter((i) => !i.isRead).length : 0),
    [items]
  )

  const handleMarkAllClick = async () => {
    if (!onMarkAllRead || unreadCount === 0 || markAllBusy) return
    setMarkAllBusy(true)
    try {
      await onMarkAllRead()
    } finally {
      setMarkAllBusy(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleRowNavigate = async (row) => {
    const key = `${row.kind}-${row.id}`
    if (!row.isRead && onMarkRead) {
      setMarkingKey(key)
      try {
        await onMarkRead(row.kind, row.id)
      } finally {
        setMarkingKey(null)
      }
    }
    if (row.href) navigate(row.href)
    onClose()
  }

  if (!open || !anchorEl || !style) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] bg-black/25"
        aria-label="סגירה"
        onClick={onClose}
      />
      <div
        className="fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-neutral-200/90 bg-white text-right shadow-xl"
        style={{
          top: style.top,
          left: style.left,
          width: style.width,
          maxHeight: style.maxHeight,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-notif-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 id="admin-notif-title" className="text-sm font-semibold text-neutral-900">
                התראות
              </h2>
              <p className="mt-0.5 text-[11px] text-neutral-500">לחיצה פותחת את הפריט ומסמנת כנקרא</p>
            </div>
            {onMarkAllRead ? (
              <button
                type="button"
                onClick={handleMarkAllClick}
                disabled={loading || unreadCount === 0 || markAllBusy}
                className="shrink-0 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {markAllBusy ? 'שומר…' : 'קרא הכל'}
              </button>
            ) : null}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 py-1.5 [scrollbar-width:thin]">
          {loading ? (
            <p className="py-6 text-center text-xs text-neutral-500">טוען…</p>
          ) : !displayItems.length ? (
            <p className="py-6 text-center text-xs text-neutral-500">אין פעילות אחרונה.</p>
          ) : (
            <ul className="space-y-1.5">
              {displayItems.map((row) => {
                const meta = KIND_META[row.kind] || { icon: '•', color: 'bg-neutral-50 border-neutral-200' }
                const rowKey = `${row.kind}-${row.id}`
                const busy = markingKey === rowKey
                const readCls = row.isRead
                  ? 'border-neutral-200 bg-neutral-100 text-neutral-600'
                  : meta.color
                return (
                  <li key={rowKey}>
                    <div
                      className={`relative flex gap-0 overflow-hidden rounded-lg border transition ${readCls}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleRowNavigate(row)}
                        disabled={busy}
                        className={`absolute inset-0 z-0 rounded-lg text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500 ${
                          row.isRead
                            ? 'hover:bg-neutral-200/60'
                            : 'hover:bg-white/35 focus-visible:bg-white/35'
                        }`}
                        aria-label={row.title ? `פתח: ${row.title}` : 'פתח התראה'}
                      />
                      <div className="relative z-[1] flex min-w-0 flex-1 gap-2 px-2 py-1.5 text-right pointer-events-none">
                        <span className="text-base leading-none shrink-0 pt-0.5" aria-hidden>
                          {meta.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-xs font-medium leading-snug ${row.isRead ? 'text-neutral-600' : 'text-neutral-900'}`}
                          >
                            {row.title}
                          </span>
                          {row.subtitle ? (
                            <span
                              className={`mt-0.5 line-clamp-2 text-[11px] ${row.isRead ? 'text-neutral-500' : 'text-neutral-600'}`}
                            >
                              {row.subtitle}
                            </span>
                          ) : null}
                          <span className="mt-0.5 block text-[10px] text-neutral-500">{formatWhen(row.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
