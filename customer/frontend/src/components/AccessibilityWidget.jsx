import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'a11y-widget-settings'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? safeParse(raw) : null
    return {
      fontScale: typeof parsed?.fontScale === 'number' ? parsed.fontScale : 1,
      highContrast: !!parsed?.highContrast,
      reduceMotion: !!parsed?.reduceMotion,
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore
    }

    const root = document.documentElement
    root.style.setProperty('--a11y-font-scale', String(clamp(settings.fontScale, 0.9, 1.4)))

    if (settings.highContrast) {
      root.setAttribute('data-a11y-contrast', 'high')
    } else {
      root.removeAttribute('data-a11y-contrast')
    }

    if (settings.reduceMotion) {
      root.setAttribute('data-a11y-motion', 'reduced')
    } else {
      root.removeAttribute('data-a11y-motion')
    }
  }, [settings])

  const actions = useMemo(() => {
    return {
      increaseFont: () => setSettings((s) => ({ ...s, fontScale: clamp(s.fontScale + 0.1, 0.9, 1.4) })),
      decreaseFont: () => setSettings((s) => ({ ...s, fontScale: clamp(s.fontScale - 0.1, 0.9, 1.4) })),
      toggleContrast: () => setSettings((s) => ({ ...s, highContrast: !s.highContrast })),
      toggleReduceMotion: () => setSettings((s) => ({ ...s, reduceMotion: !s.reduceMotion })),
      reset: () => setSettings({ fontScale: 1, highContrast: false, reduceMotion: false }),
    }
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-sm border border-neutral-200 shadow-lg rounded-full w-12 h-12 flex items-center justify-center"
        aria-label="כפתור נגישות"
        title="נגישות"
      >
        ♿
      </button>

      {isOpen && (
        <div
          className="fixed bottom-20 right-6 z-50 bg-white/95 backdrop-blur-sm border border-neutral-200 shadow-xl rounded-2xl p-4 w-[260px]"
          role="dialog"
          aria-label="הגדרות נגישות"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-neutral-900">נגישות</div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-neutral-700"
              aria-label="סגירה"
              title="סגירה"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm text-neutral-700">גודל טקסט</div>
              <div className="flex gap-2">
                <button type="button" onClick={actions.decreaseFont} className="a11y-widget-btn flex-1" aria-label="הקטן טקסט">
                  A-
                </button>
                <button type="button" onClick={actions.increaseFont} className="a11y-widget-btn flex-1" aria-label="הגדל טקסט">
                  A+
                </button>
              </div>
              <div className="text-xs text-neutral-500">כעת: {Math.round(settings.fontScale * 100)}%</div>
            </div>

            <button
              type="button"
              onClick={actions.toggleContrast}
              className={`a11y-widget-btn w-full ${settings.highContrast ? 'a11y-widget-btn-active' : ''}`}
            >
              ניגודיות גבוהה
            </button>

            <button
              type="button"
              onClick={actions.toggleReduceMotion}
              className={`a11y-widget-btn w-full ${settings.reduceMotion ? 'a11y-widget-btn-active' : ''}`}
            >
              הפחת אנימציות
            </button>

            <button type="button" onClick={actions.reset} className="a11y-widget-btn w-full">
              איפוס
            </button>
          </div>
        </div>
      )}
    </>
  )
}


