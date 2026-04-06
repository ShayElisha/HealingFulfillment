import { useState, useEffect } from 'react'
import AnimatedSection from './AnimatedSection'

/** איור דלתות (מוח / צמחים / טקסט בעברית + ידיות) — מוצג מפוצל לשתי דלתות */
const DOOR_ART = '/images/for-whom-doors-art.png'

/** דסקטופ: פתיחה ב־CSS :hover / focus-within. מגע: מחלקה forwhom-door-card--open */
function useForWhomHoverMode() {
  const [hoverMode, setHoverMode] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setHoverMode(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return hoverMode
}

function doorArtStyle(half) {
  const pos = half === 'left' ? 'left' : 'right'
  return {
    backgroundColor: '#3d2f27',
    backgroundImage: [
      'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 42%, rgba(0,0,0,0.1) 100%)',
      `url(${DOOR_ART})`,
      'linear-gradient(165deg, #5a4638 0%, #3d2f27 55%, #2a211c 100%)',
    ].join(', '),
    backgroundSize: '100% 100%, 200% 100%, 100% 100%',
    backgroundPosition: `0 0, ${pos} center, 0 0`,
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
    boxShadow: [
      'inset 0 2px 6px rgba(255,255,255,0.06)',
      'inset 0 -12px 28px rgba(0,0,0,0.22)',
    ].join(', '),
  }
}

export default function ForWhomAudienceDoorCard({ item, index }) {
  const hoverMode = useForWhomHoverMode()
  const [open, setOpen] = useState(false)

  const pointerHandlers = hoverMode
    ? {}
    : {
        onClick: () => setOpen((o) => !o),
      }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!hoverMode) setOpen((o) => !o)
    }
  }

  const cardClass = [
    'group',
    'forwhom-door-card',
    'flex w-full flex-col items-center rounded-xl outline-none',
    'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    hoverMode ? '' : 'cursor-pointer touch-manipulation',
    !hoverMode && open ? 'forwhom-door-card--open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AnimatedSection delay={Math.min(index * 0.08, 0.5)} className="h-full min-h-0">
      <div className="mx-auto flex h-full w-full max-w-[300px] flex-col items-center">
        <h3
          className="mb-4 flex min-h-[4.5rem] items-end justify-center px-1 text-center text-lg font-serif font-semibold leading-snug text-neutral-900 sm:mb-5 sm:text-xl"
          id={`for-whom-card-title-${index}`}
        >
          {item.title}
        </h3>
        <div
          {...pointerHandlers}
          onKeyDown={onKeyDown}
          tabIndex={0}
          className={cardClass}
          role={hoverMode ? undefined : 'button'}
          aria-expanded={hoverMode ? undefined : open}
          aria-labelledby={`for-whom-card-title-${index}`}
          aria-label={
            hoverMode ? undefined : `${open ? 'סגירת' : 'פתיחת'} פרטים: ${item.title}`
          }
        >
          <p className="sr-only">{item.description}</p>
          <div
            className="relative aspect-[3/4] w-full min-h-[240px] max-h-[360px] min-[480px]:min-h-[280px] min-[480px]:max-h-[400px] sm:max-h-[440px] overflow-visible rounded-xl"
            aria-hidden
          >
            <div className="absolute inset-0 overflow-visible rounded-xl bg-gradient-to-b from-amber-50/90 via-neutral-100 to-neutral-200/95 p-[6px] shadow-[0_12px_40px_-12px_rgba(60,40,28,0.28),0_2px_8px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-amber-900/10 min-[480px]:p-[7px]">
              <div className="relative h-full w-full overflow-visible rounded-lg bg-gradient-to-b from-neutral-300/45 to-neutral-400/25 p-[3px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)]">
                <div className="absolute inset-[8px] z-0 flex min-h-0 flex-col overflow-hidden rounded-md border border-amber-900/10 bg-gradient-to-b from-white via-neutral-50/98 to-amber-50/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] min-[480px]:inset-[10px]">
                  <p className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-right text-xs leading-relaxed text-neutral-700 min-[480px]:px-5 min-[480px]:py-4 sm:px-6 sm:text-sm">
                    {item.description}
                  </p>
                </div>
                <div
                  dir="ltr"
                  className="forwhom-door-swing absolute inset-[3px] z-10 flex w-auto overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.07)]"
                >
                  <div
                    className="forwhom-door forwhom-door-left relative h-full min-h-0 w-1/2 min-w-[50%] max-w-[50%] flex-[1_1_50%] shrink-0 overflow-hidden rounded-l-lg"
                    style={doorArtStyle('left')}
                  />
                  <div
                    className="forwhom-door forwhom-door-right relative h-full min-h-0 w-1/2 min-w-[50%] max-w-[50%] flex-[1_1_50%] shrink-0 overflow-hidden rounded-r-lg"
                    style={doorArtStyle('right')}
                  />
                </div>
              </div>
            </div>
          </div>
          <p
            className={`mt-3 text-center text-xs transition-colors ${
              hoverMode
                ? 'text-neutral-500 group-hover:text-primary-600/80'
                : open
                  ? 'text-primary-600/80'
                  : 'text-neutral-500'
            }`}
          >
            {hoverMode ? 'העברו את העכבר לפתיחה' : 'לחצו על הדלת לפתיחה ולסגירה'}
          </p>
        </div>
      </div>
    </AnimatedSection>
  )
}
