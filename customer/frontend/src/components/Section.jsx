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
      className={`section-padding ${variantClasses[variant]} ${className}`}
    >
      <div className="container-custom">
        {children}
      </div>
    </section>
  )
}

export default Section

