import { usePurchase } from '../context/PurchaseContext'
import Button from './Button'

/** קריאה לפעולה בתחתית עמוד «למי זה מתאים» — פגישה ראשונית או רכישה */
export default function ForWhomDetailCta() {
  const { openPurchaseModal } = usePurchase()

  return (
    <div className="relative mt-14 overflow-hidden rounded-3xl border border-primary-200/60 bg-gradient-to-br from-[#fffaf2] via-white to-[#f7efe3] p-8 shadow-[0_28px_60px_-28px_rgba(120,80,40,0.35)] ring-1 ring-white/80 sm:p-10">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary-200/40 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-amber-200/35 blur-2xl"
        aria-hidden
      />
      <h2 className="text-center font-serif text-xl font-bold text-neutral-900 sm:text-2xl md:text-3xl">
        מה הצעד הבא בשבילכם?
      </h2>
      <p dir="rtl" className="mx-auto mt-3 max-w-xl text-center text-sm text-neutral-600 sm:text-base">
        קבעו פגישת היכרות קצרה, או בחרו מסלול מהאתר והמשיכו לרכישה מאובטחת.
      </p>
      <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Button to="/booking" variant="primary" className="min-h-[48px] flex-1 px-6 text-base sm:flex-initial sm:min-w-[200px]">
          קביעת פגישה ראשונית
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-[48px] flex-1 px-6 text-base sm:flex-initial sm:min-w-[200px]"
          onClick={() => openPurchaseModal(null)}
        >
          מעבר לרכישה
        </Button>
      </div>
    </div>
  )
}
