import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { purchaseService } from '../services/purchaseApi'
import Section from '../components/Section'
import Button from '../components/Button'

const POLL_MS = 2000
const MAX_POLLS = 45

/**
 * דף שמוצג אחרי SuccessRedirectUrl מ-Cardcom.
 * אישור במסד: webhook או (אם יש ב-URL) lowProfileCode → אימות מול Cardcom בשרת, ואז poll לווידוא.
 */
function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')?.trim() || ''
  const lowProfileCode =
    searchParams.get('lowprofilecode')?.trim() ||
    searchParams.get('LowProfileCode')?.trim() ||
    ''

  const [phase, setPhase] = useState(() => (orderId ? 'loading' : 'bad_params'))
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!orderId) {
      setPhase('bad_params')
      return
    }

    let cancelled = false
    let polls = 0
    let timer

    const applyStatusPayload = (data) => {
      if (data?.paymentStatus === 'succeeded' || data?.paymentStatus === 'paid') {
        setPhase('paid')
        setDetail(data)
        return true
      }
      if (data?.paymentStatus === 'failed') {
        setPhase('failed')
        setDetail(data)
        return true
      }
      return false
    }

    const tick = async () => {
      try {
        const res = await purchaseService.getPaymentStatus(orderId)
        const data = res?.data
        if (cancelled) return

        if (applyStatusPayload(data)) return

        polls += 1
        if (polls >= MAX_POLLS) {
          setPhase('pending_timeout')
          setDetail(data)
          return
        }
        timer = setTimeout(tick, POLL_MS)
      } catch (e) {
        if (cancelled) return
        if (e.response?.status === 404) {
          setPhase('error')
          setDetail({ message: 'ההזמנה לא נמצאה' })
          return
        }
        setPhase('error')
        setDetail({ message: e.response?.data?.message || 'שגיאה בבדיקת סטטוס התשלום' })
      }
    }

    const run = async () => {
      if (lowProfileCode) {
        try {
          const confirmRes = await purchaseService.confirmCardcomRedirect({
            orderId,
            lowProfileCode,
          })
          const d = confirmRes?.data
          if (!cancelled && d && applyStatusPayload(d)) return
        } catch {
          /* נמשיך ל-poll — webhook או ניסיון חוזר */
        }
      }
      if (cancelled) return
      tick()
    }

    run()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [orderId, lowProfileCode])

  return (
    <>
      <Helmet>
        <title>תשלום | ממתין לאישור</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <Section variant="white" className="min-h-[70vh] !pt-28 md:!pt-32">
        <div className="max-w-xl mx-auto text-center px-4">
          {!orderId && (
            <>
              <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-4">חסר מזהה הזמנה</h1>
              <p className="text-neutral-600 mb-8">לא ניתן לאמת את התשלום ללא פרטי ההזמנה.</p>
              <Button to="/">חזרה לדף הבית</Button>
            </>
          )}

          {orderId && phase === 'loading' && (
            <>
              <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-4">מאשרים את התשלום…</h1>
              <p className="text-neutral-600 mb-2">
                עמוד זה בודק מול השרת את סטטוס התשלום (אישור סופי מגיע מהמערכת, לא מהדפדפן בלבד).
              </p>
              <p className="text-sm text-neutral-500 mb-8">נא להמתין מספר שניות.</p>
              <div className="flex justify-center">
                <div className="h-10 w-10 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            </>
          )}

          {orderId && phase === 'paid' && (
            <>
              <h1 className="text-2xl font-serif font-bold text-primary-700 mb-4">התשלום אושר</h1>
              <p className="text-neutral-600 mb-8">
                תודה! הרכישה נרשמה במערכת. אם יש לך חשבון לקוח, אפשר לצפות במסלול תחת תיק לקוח.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button to="/customer/login" variant="primary">
                  התחברות לתיק לקוח
                </Button>
                <Button to="/" variant="soft">
                  דף הבית
                </Button>
              </div>
            </>
          )}

          {orderId && phase === 'failed' && (
            <>
              <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-4">התשלום לא הושלם</h1>
              <p className="text-neutral-600 mb-8">
                העסקה לא אושרה במערכת. אפשר לנסות שוב או ליצור קשר לעזרה.
              </p>
              <Button to="/courses" variant="primary">
                חזרה למסלולים
              </Button>
            </>
          )}

          {orderId && phase === 'pending_timeout' && (
            <>
              <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-4">עדיין ממתינים לאישור</h1>
              <p className="text-neutral-600 mb-4">
                הסטטוס עדיין «ממתין». לעיתים האישור מהסולק מגיע עם עיכוב קצר.
              </p>
              <p className="text-sm text-neutral-500 mb-8">
                אם כבר חויבת בכרטיס ולא מתעדכן — צור קשר וציין את מספר ההזמנה:{' '}
                <span className="font-mono dir-ltr inline-block">{orderId}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button to="/contact" variant="primary">
                  צור קשר
                </Button>
                <Button to="/" variant="soft">
                  דף הבית
                </Button>
              </div>
            </>
          )}

          {orderId && phase === 'error' && (
            <>
              <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-4">לא ניתן לבדוק את הסטטוס</h1>
              <p className="text-neutral-600 mb-8">{detail?.message || 'אירעה שגיאה'}</p>
              <Button to="/" variant="primary">
                דף הבית
              </Button>
            </>
          )}
        </div>
      </Section>
    </>
  )
}

export default PaymentSuccessPage
