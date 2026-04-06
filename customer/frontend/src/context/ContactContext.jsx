import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const ContactContext = createContext()

export function ContactProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openContactModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const closeContactModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isModalOpen,
      openContactModal,
      closeContactModal,
    }),
    [isModalOpen, openContactModal, closeContactModal]
  )

  return <ContactContext.Provider value={value}>{children}</ContactContext.Provider>
}

export function useContact() {
  const context = useContext(ContactContext)
  if (!context) {
    throw new Error('useContact must be used within ContactProvider')
  }
  return context
}
