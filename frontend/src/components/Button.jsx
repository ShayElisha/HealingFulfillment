import { Link } from 'react-router-dom'

function Button({ 
  children, 
  to, 
  href, 
  variant = 'primary', 
  className = '', 
  onClick,
  type = 'button',
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 active:scale-95'
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    soft: 'btn-soft',
  }

  const classes = `${baseClasses} ${variants[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button

