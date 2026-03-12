import { motion } from 'framer-motion'

function Section({ 
  children, 
  className = '', 
  id,
  variant = 'default' 
}) {
  const variantClasses = {
    default: 'bg-neutral-50',
    white: 'bg-white',
    primary: 'bg-primary-50', // Light background for dark text
    neutral: 'bg-neutral-100',
  }

  return (
    <section
      id={id}
      className={`section-padding ${className} relative`}
      style={{ zIndex: 10, position: 'relative' }}
    >
      <div className={`absolute inset-0 ${variantClasses[variant]}`} style={{ zIndex: 0 }}></div>
      <div className="container-custom relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </section>
  )
}

export default Section

