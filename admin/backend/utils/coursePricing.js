/**
 * סכום לחיוב בפועל — חייב להתאים ללוגיקת תצוגת המחיר ב־frontend.
 */
export function getChargeableAmount(course) {
  const price = Number(course?.price)
  if (Number.isNaN(price) || price < 0) return 0

  const discountPercent = Number(course?.discount || 0)
  if (discountPercent > 0) {
    return Math.round(price * (1 - discountPercent / 100))
  }

  const originalPrice = Number(course?.originalPrice)
  if (!Number.isNaN(originalPrice) && originalPrice > price) {
    return Math.round(price)
  }

  return Number(price.toFixed(2))
}
