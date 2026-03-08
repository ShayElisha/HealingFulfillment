function Section({ 
  children, 
  className = '', 
  variant = 'default' 
}) {
  const variantClasses = {
    default: 'bg-neutral-50',
    white: 'bg-white',
    primary: 'bg-primary-50',
  }

  return (
    <section
      className={`section-padding ${variantClasses[variant]} ${className}`}
    >
      <div className="container-custom">
        {children}
      </div>
    </section>
  )
}

export default Section

