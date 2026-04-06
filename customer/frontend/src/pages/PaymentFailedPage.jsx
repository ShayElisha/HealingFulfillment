import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Section from '../components/Section'
import Button from '../components/Button'

function PaymentFailedPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')?.trim() || ''

  return (
    <>
      <Helmet>
        <title>תשלום נכשל</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <Section variant="white" className="min-h-[70vh] !pt-28 md:!pt-32">
        <div className="max-w-xl mx-auto text-center px-4">
          <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-4">התשלום לא הושלם</h1>
          <p className="text-neutral-600 mb-4">
            ייתכן שהפעולה בוטלה או נדחתה על ידי חברת האשראי או הסולק.
          </p>
          {orderId && (
            <p className="text-sm text-neutral-500 mb-8">
              מזהה הזמנה: <span className="font-mono dir-ltr inline-block">{orderId}</span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button to="/courses" variant="primary">
              נסה שוב ממסלולים
            </Button>
            <Button to="/contact" variant="soft">
              צור קשר
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}

export default PaymentFailedPage
