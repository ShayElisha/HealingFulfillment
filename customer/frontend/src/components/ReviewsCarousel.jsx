import { useMemo, useState, useEffect } from 'react'
import Card from './Card'

function ReviewCard({ review }) {
  return (
    <Card className="flex h-full min-h-[220px] w-full flex-col sm:min-h-[240px]" hover={false}>
      <div dir="rtl" className="flex flex-1 flex-col text-right">
        <div className="mb-2 flex shrink-0 justify-end text-base text-accent-500 sm:mb-3 sm:text-lg">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star}>{star <= review.rating ? '⭐' : '☆'}</span>
          ))}
        </div>
        <p className="mb-2 line-clamp-5 min-h-0 flex-1 text-sm leading-relaxed text-neutral-700 sm:text-base italic">
          &quot;{review.content}&quot;
        </p>
        {review.video?.url && (
          <div className="mb-2">
            <video
              src={review.video.url}
              controls
              className="w-full rounded-lg border border-neutral-200"
            />
          </div>
        )}
        <div className="mt-auto shrink-0">
          <p className="text-sm font-semibold text-neutral-900 sm:text-base">
            — {review.customerName || review.customer?.name || 'לקוח'}
          </p>
          {review.createdAt && (
            <p className="mt-2 text-xs text-neutral-500 sm:text-sm">
              {new Date(review.createdAt).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

const GAP = 'gap-5 sm:gap-6 md:gap-8'
const SEG_TAIL = 'w-5 shrink-0 sm:w-6 md:w-8'
const CARD_WRAP = 'flex w-[min(270px,calc(75vw-1.5rem))] shrink-0 sm:w-[300px]'

function ReviewSegment({ reviews, keyPrefix, ariaHidden }) {
  return (
    <div
      className={`flex shrink-0 flex-nowrap flex-row items-stretch ${GAP}`}
      dir="ltr"
      aria-hidden={ariaHidden || undefined}
    >
      {reviews.map((review) => (
        <div key={`${keyPrefix}-${review._id}`} className={CARD_WRAP}>
          <ReviewCard review={review} />
        </div>
      ))}
      <div className={SEG_TAIL} aria-hidden />
    </div>
  )
}

/**
 * שני מקטעים זהים + זנב; אנימציית -50% על רוחב המסלול.
 */
function ReviewsCarousel({ reviews }) {
  const [reduceMotion, setReduceMotion] = useState(false)

  const durationSec = useMemo(() => {
    const n = reviews.length
    if (n <= 0) return 88
    const base = Math.min(130, Math.max(50, n * 6.5))
    return Math.min(175, base + 18)
  }, [reviews.length])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (!reviews.length) return null

  if (reduceMotion) {
    return (
      <div className="mx-auto w-[min(100%,80vw)] px-2 sm:px-4">
        <div
          className="flex flex-wrap justify-center gap-4 sm:gap-6"
          role="region"
          aria-label="חוות דעת של לקוחות"
        >
          {reviews.map((review) => (
            <div key={review._id} className={`flex ${CARD_WRAP}`}>
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="reviews-marquee-wrap mx-auto w-[min(100%,80vw)] px-2 sm:px-4"
      role="region"
      aria-label="חוות דעת של לקוחות, גלילה אינסופית"
    >
      <div
        className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}
      >
        <div
          className="reviews-marquee-row flex w-max flex-nowrap flex-row"
          dir="ltr"
          style={{ animationDuration: `${durationSec}s` }}
        >
          <ReviewSegment reviews={reviews} keyPrefix="a" />
          <ReviewSegment reviews={reviews} keyPrefix="b" ariaHidden />
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-neutral-500 sm:mt-4 sm:text-sm">
        מעבירים את העכבר כדי לעצור זמנית את הגלילה
      </p>
    </div>
  )
}

export default ReviewsCarousel
