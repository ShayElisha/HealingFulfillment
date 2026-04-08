/**
 * מחזיר מידע להטמעת סרטון מקישור YouTube / Vimeo / קובץ וידאו ישיר.
 * @param {string} raw
 * @returns {{ kind: 'iframe', src: string } | { kind: 'video', src: string } | null}
 */
export function parseVideoEmbedUrl(raw) {
  if (raw == null || typeof raw !== 'string') return null
  const url = raw.trim()
  if (!url) return null

  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname.startsWith('/watch')) {
        const id = u.searchParams.get('v')
        if (id && /^[\w-]{11}$/.test(id)) {
          return {
            kind: 'iframe',
            src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
          }
        }
      }
      if (u.pathname.startsWith('/embed/')) {
        const id = u.pathname.split('/')[2]?.split('?')[0]
        if (id && /^[\w-]{11}$/.test(id)) {
          return {
            kind: 'iframe',
            src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
          }
        }
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2]?.split('?')[0]
        if (id && /^[\w-]{11}$/.test(id)) {
          return {
            kind: 'iframe',
            src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
          }
        }
      }
    }

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]?.split('?')[0]
      if (id && /^[\w-]{11}$/.test(id)) {
        return {
          kind: 'iframe',
          src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
        }
      }
    }

    if (host === 'vimeo.com') {
      const parts = u.pathname.split('/').filter(Boolean)
      const id = parts[0]
      if (id && /^\d+$/.test(id)) {
        return { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` }
      }
    }

    if (host === 'player.vimeo.com' && u.pathname.startsWith('/video/')) {
      const id = u.pathname.split('/')[2]?.split('?')[0]
      if (id && /^\d+$/.test(id)) {
        return { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` }
      }
    }
  } catch {
    return null
  }

  const lower = url.toLowerCase()
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(lower)) {
    return { kind: 'video', src: url }
  }

  return null
}
