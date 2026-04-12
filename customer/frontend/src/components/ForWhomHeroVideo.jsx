import { parseVideoEmbedUrl } from '../utils/videoEmbed'
import { resolveAdminAssetUrl } from '../utils/resolveAdminAssetUrl'

/**
 * סרטון/הטמעה בולטת מתחת לכותרת — YouTube, Vimeo או קישור ישיר ל־mp4/webm/ogg.
 */
export default function ForWhomHeroVideo({ url, title }) {
  if (!url || !String(url).trim()) return null

  const trimmed = String(url).trim()
  const resolved = resolveAdminAssetUrl(trimmed)
  const embed = parseVideoEmbedUrl(resolved)
  const label = title ? `סרטון: ${title}` : 'סרטון'

  if (embed?.kind === 'iframe') {
    return (
      <div className="mt-8 w-full">
        <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-black shadow-[0_24px_64px_-24px_rgba(0,0,0,0.4)] ring-1 ring-black/5 aspect-video">
          <iframe
            src={embed.src}
            title={label}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    )
  }

  if (embed?.kind === 'video') {
    return (
      <div className="mt-8 w-full">
        <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-black shadow-[0_24px_64px_-24px_rgba(0,0,0,0.4)] ring-1 ring-black/5 aspect-video">
          <video
            src={embed.src}
            className="absolute inset-0 h-full w-full object-contain"
            controls
            playsInline
            preload="metadata"
          >
            הדפדפן שלך לא תומך בהצגת וידאו ישיר.
          </video>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-5 text-center sm:px-6">
      <p className="text-sm text-neutral-700">
        הקישור לא זוהה כהטמעת YouTube/Vimeo או קובץ וידאו ישיר. אפשר לצפות בדף המקורי:
      </p>
      <a
        href={resolved}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex text-base font-semibold text-primary-700 underline-offset-2 hover:text-primary-600 hover:underline"
      >
        פתיחת הקישור בלשונית חדשה
      </a>
    </div>
  )
}
