import { createContext, useContext, useState } from 'react'

const ContactContext = createContext()

export function ContactProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openContactModal = () => {
    setIsModalOpen(true)
  }

  const closeContactModal = () => {
    setIsModalOpen(false)
  }

  return (
    <ContactContext.Provider
      value={{
        isModalOpen,
        openContactModal,
        closeContactModal,
      }}
    >
      {children}
    </ContactContext.Provider>
  )
}

export function useContact() {
  const context = useContext(ContactContext)
  if (!context) {
    throw new Error('useContact must be used within ContactProvider')
  }
  return context
}

