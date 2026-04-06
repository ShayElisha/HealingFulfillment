import { createContext, useContext, useState, useCallback, useMemo } from 'react'

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

  const openPurchaseModal = useCallback((course = null) => {
    setSelectedCourse(course)
    setIsModalOpen(true)
  }, [])

  const closePurchaseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedCourse(null)
  }, [])

  const value = useMemo(
    () => ({
      isModalOpen,
      selectedCourse,
      openPurchaseModal,
      closePurchaseModal,
    }),
    [isModalOpen, selectedCourse, openPurchaseModal, closePurchaseModal]
  )

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>
}
