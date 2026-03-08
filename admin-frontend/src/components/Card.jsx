function Card({ children, className = '' }) {
  return (
    <div className={`card-soft ${className}`}>
      {children}
    </div>
  )
}

export default Card

