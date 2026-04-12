/**
 * רינדור בלוקי תוכן מ־detailBlocks (ציר זמן בנקודות, אודיו, תמונות).
 */
function getTimelinePoints(block) {
  if (Array.isArray(block.timelinePoints) && block.timelinePoints.length > 0) {
    const pts = block.timelinePoints.map((p) => String(p || '').trim()).filter(Boolean)
    if (pts.length > 0) return pts
  }
  if (block.timelineText && String(block.timelineText).trim()) {
    return String(block.timelineText)
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export default function ForWhomDetailBlocks({ blocks }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null

  return (
    <div className="mt-12 space-y-12">
      {blocks.map((block, idx) => {
        const key = block._id || `block-${idx}`
        if (block.type === 'timeline') {
          const points = getTimelinePoints(block)
          if (points.length === 0) return null
          return (
            <section key={key} className="rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-sm sm:p-7">
              <h3 className="font-serif text-xl font-semibold text-neutral-900 sm:text-2xl">
                ציר זמן
              </h3>
              <ul className="relative mt-5 flex gap-4 overflow-x-auto pb-2 text-right sm:gap-5" dir="rtl">
                <span
                  className="pointer-events-none absolute left-4 right-4 top-8 h-[2px] rounded-full bg-primary-200"
                  aria-hidden
                />
                {points.map((p, i) => (
                  <li
                    key={i}
                    className="relative z-[1] min-w-[220px] flex-1 rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border-2 border-white bg-primary-600 shadow-[0_0_0_2px_rgba(125,99,71,0.25)]"
                        aria-hidden
                      />
                      <span className="text-xs font-semibold text-primary-700">שלב {i + 1}</span>
                    </div>
                    <span className="block text-base leading-relaxed text-neutral-800 sm:text-lg">{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        }
        if (block.type === 'audio' && String(block.audioUrl || '').trim()) {
          return (
            <section key={key} className="rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-sm sm:p-7">
              <h3 className="font-serif text-xl font-semibold text-neutral-900 sm:text-2xl">
                {block.audioTitle?.trim() || 'האזנה'}
              </h3>
              <audio
                className="mt-4 w-full max-w-2xl"
                controls
                preload="metadata"
                src={String(block.audioUrl).trim()}
              >
                הדפדפן לא תומך בנגן האודיו.
              </audio>
            </section>
          )
        }
        if (
          block.type === 'images' &&
          Array.isArray(block.imageItems) &&
          block.imageItems.length > 0
        ) {
          const items = block.imageItems.filter((i) => i && String(i.url || '').trim())
          if (items.length === 0) return null
          return (
            <section key={key}>
              <h3 className="font-serif text-xl font-semibold text-neutral-900 sm:text-2xl">
                תמונות
              </h3>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {items.map((img, j) => (
                  <figure key={`${key}-${j}`} className="overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-50 shadow-sm">
                    <img
                      src={String(img.url).trim()}
                      alt={img.caption?.trim() || ''}
                      className="h-auto w-full object-cover"
                      loading="lazy"
                    />
                    {img.caption?.trim() ? (
                      <figcaption className="px-3 py-2 text-right text-sm text-neutral-600">
                        {img.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </section>
          )
        }
        return null
      })}
    </div>
  )
}
