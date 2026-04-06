function Card({ children, className = '', variant = 'soft' }) {
  const shell =
    variant === 'flush'
      ? 'rounded-2xl border border-neutral-200/70 bg-white/85 shadow-soft-md backdrop-blur-sm p-6 md:p-8 transition-all duration-300 hover:shadow-soft-lg hover:border-primary-200/50'
      : 'card-soft'
  return (
    <div className={`${shell} ${className}`.trim()}>
      {children}
    </div>
  )
}

export default Card

