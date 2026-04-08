import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { forWhomAudienceService } from '../services/api'
import Section from '../components/Section'
import Card from '../components/Card'
import ForWhomHeroVideo from '../components/ForWhomHeroVideo'
import ForWhomDetailBlocks from '../components/ForWhomDetailBlocks'
import ForWhomDetailCta from '../components/ForWhomDetailCta'

function ForWhomAudienceDetailPage() {
  const { id } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    let cancelled = false
    async function load() {
      if (!id) {
        setError('חסר מזהה דף')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await forWhomAudienceService.getPageById(id)
        if (!cancelled) setPage(res?.data || null)
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || 'לא ניתן לטעון את הדף')
          setPage(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const headTitle = page ? `${page.title} | למי זה מתאים` : 'למי זה מתאים'

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center pt-24 text-neutral-600">
        טוען…
      </div>
    )
  }

  if (error || !page) {
    return (
      <Section variant="white" className="py-16">
        <div className="container-custom max-w-xl text-center">
          <h1 className="font-serif text-2xl font-bold text-neutral-900">הדף לא נמצא</h1>
          <p className="mt-3 text-neutral-600">{error}</p>
          <Link
            to="/#for-whom"
            className="mt-6 inline-block text-primary-600 hover:text-primary-700 hover:underline"
          >
            חזרה ל«למי זה מתאים»
          </Link>
        </div>
      </Section>
    )
  }

  return (
    <>
      <Helmet>
        <title>{headTitle}</title>
        <meta
          name="description"
          content={page.description?.slice(0, 160) || page.title}
        />
      </Helmet>
      <Section variant="white" className="relative overflow-hidden bg-gradient-to-b from-[#f6f2ec] via-[#fffdfb] to-[#f8f5f1] py-12 sm:py-16">
        <div
          className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto w-[94%] max-w-[1600px] sm:w-[88%] xl:w-[80%]">
          <Link
            to="/#for-whom"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-200/60 bg-white/80 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm backdrop-blur hover:border-primary-300 hover:text-primary-800"
          >
            ← חזרה ל«למי זה מתאים»
          </Link>
          <Card className="mx-auto border border-white/70 bg-white/85 p-5 shadow-[0_35px_90px_-38px_rgba(65,45,28,0.4)] ring-1 ring-amber-100/70 backdrop-blur-md sm:p-8 md:p-10">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-neutral-200/80 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-neutral-600">
              FOR WHOM
            </div>
            <h1 className="text-center font-serif text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
              {page.title}
            </h1>
            <ForWhomHeroVideo url={page.detailVideoUrl} title={page.title} />
            <p
              className={
                page.detailVideoUrl?.trim()
                  ? 'mt-8 text-center text-sm font-semibold uppercase tracking-wide text-neutral-500 sm:mt-10'
                  : 'mt-4 text-center text-sm font-semibold uppercase tracking-wide text-neutral-500'
              }
            >
              תקציר (כפי שמופיע מאחורי הדלת)
            </p>
            <div className="mt-3 rounded-2xl border border-primary-100/90 bg-gradient-to-br from-white via-primary-50/55 to-amber-50/45 px-5 py-5 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_26px_-20px_rgba(120,90,60,0.4)] sm:px-7 sm:py-6">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-neutral-800 sm:text-lg">
                {page.description}
              </p>
            </div>
            <div className="mt-12 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary-300/70 to-primary-200/30" />
              <h2 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">המשך לקריאה</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary-300/70 to-primary-200/30" />
            </div>
            <div className="mt-5 rounded-2xl border border-neutral-200/80 bg-white/95 p-5 text-right shadow-[0_20px_40px_-32px_rgba(0,0,0,0.35)] sm:p-7">
              {page.detailPageContent?.trim() ? (
                <div className="whitespace-pre-wrap text-base leading-relaxed text-neutral-800 sm:text-lg">
                  {page.detailPageContent}
                </div>
              ) : (
                <p className="text-neutral-500">תוכן מורחב יתווסף בקרוב.</p>
              )}
            </div>
            <ForWhomDetailBlocks blocks={page.detailBlocks} />
            <ForWhomDetailCta />
          </Card>
        </div>
      </Section>
    </>
  )
}

export default ForWhomAudienceDetailPage
