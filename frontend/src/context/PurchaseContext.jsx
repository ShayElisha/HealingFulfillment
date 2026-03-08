import { createContext, useContext, useState } from 'react'

const PurchaseContext = createContext()

export const usePurchase = () => {
  const context = useContext(PurchaseContext)
  if (!context) {
    throw new Error('usePurchase must be used within PurchaseProvider')
  }
  return context
}

export const PurchaseProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)

  const openPurchaseModal = (course = null) => {
    setSelectedCourse(course)
    setIsModalOpen(true)
  }

  const closePurchaseModal = () => {
    setIsModalOpen(false)
    setSelectedCourse(null)
  }

  return (
    <PurchaseContext.Provider
      value={{
        isModalOpen,
        selectedCourse,
        openPurchaseModal,
        closePurchaseModal,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  )
}

