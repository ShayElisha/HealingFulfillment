import { useEffect, useState } from 'react'
import Card from '../Card'
import toast from 'react-hot-toast'
import { bookingService } from '../../services/adminApi'

export default function BookingCard({ booking, onUpdate }) {
  const [zoomLinkInput, setZoomLinkInput] = useState(booking.zoomLink || '')
  const [isEditingZoomLink, setIsEditingZoomLink] = useState(false)

  useEffect(() => {
    setZoomLinkInput(booking.zoomLink || '')
  }, [booking.zoomLink])

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">{booking.name}</h3>
          <div className="space-y-1 text-sm text-neutral-600">
            {booking.email && <p>📧 {booking.email}</p>}
            <p>📞 {booking.phone}</p>
            <p>
              📅 תאריך מועדף:{' '}
              {new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {booking.preferredTime && <p>🕐 שעה מועדפת: {booking.preferredTime}</p>}
            <p>💻 סוג פגישה: {booking.meetingType === 'zoom' ? 'אונליין' : 'פרונטאלית'}</p>

            {booking.status === 'confirmed' && booking.meetingType === 'zoom' && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                {isEditingZoomLink ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={zoomLinkInput}
                      onChange={(e) => setZoomLinkInput(e.target.value)}
                      placeholder="הכנס לינק אונליין (https://zoom.us/j/...)"
                      className="w-full px-3 py-2 text-sm rounded border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await bookingService.updateZoomLink(booking._id, zoomLinkInput)
                            await onUpdate()
                            setIsEditingZoomLink(false)
                            toast.success('לינק אונליין עודכן בהצלחה!')
                          } catch {
                            toast.error('שגיאה בעדכון לינק אונליין')
                          }
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => {
                          setZoomLinkInput(booking.zoomLink || '')
                          setIsEditingZoomLink(false)
                        }}
                        className="px-3 py-1 text-xs bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {booking.zoomLink ? (
                      <div>
                        <p className="text-xs text-blue-700 mb-1 font-medium">🔗 לינק אונליין:</p>
                        <a
                          href={booking.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all text-xs"
                        >
                          {booking.zoomLink}
                        </a>
                        <button
                          onClick={() => {
                            setZoomLinkInput(booking.zoomLink || '')
                            setIsEditingZoomLink(true)
                          }}
                          className="mt-2 block text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          ערוך לינק
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-blue-700 mb-2">אין לינק אונליין. הוסף לינק:</p>
                        <button
                          onClick={() => setIsEditingZoomLink(true)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          הוסף לינק אונליין
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {booking.notes && <p className="mt-2 text-neutral-500">📝 הערות: {booking.notes}</p>}
            <p className="text-xs text-neutral-400 mt-2">
              נרשם ב:{' '}
              {new Date(booking.createdAt).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span
            className={`px-3 py-1 text-xs rounded-full ${
              booking.status === 'confirmed'
                ? 'bg-green-100 text-green-700'
                : booking.status === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {booking.status === 'confirmed' ? 'אושר' : booking.status === 'cancelled' ? 'בוטל' : 'ממתין'}
          </span>
          <select
            value={booking.status}
            onChange={async (e) => {
              try {
                await bookingService.updateStatus(booking._id, e.target.value)
                await onUpdate()
              } catch {
                toast.error('שגיאה בעדכון הסטטוס')
              }
            }}
            className="text-xs px-2 py-1 border border-neutral-300 rounded"
          >
            <option value="pending">ממתין</option>
            <option value="confirmed">אושר</option>
            <option value="cancelled">בוטל</option>
          </select>
        </div>
      </div>
    </Card>
  )
}
