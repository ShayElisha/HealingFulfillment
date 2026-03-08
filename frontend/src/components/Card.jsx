import { motion } from 'framer-motion'

function Card({ children, className = '', hover = true }) {
  return (
    <motion.div
      className={`card-soft ${className}`}
      whileHover={hover ? { y: -5 } : {}}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

export default Card

