function Button({ 
  children, 
  href, 
  variant = 'primary', 
  className = '', 
  onClick,
  type = 'button',
  disabled = false,
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    soft: 'btn-soft',
  }

  const classes = `${baseClasses} ${variants[variant]} ${className}`

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

export default Button

