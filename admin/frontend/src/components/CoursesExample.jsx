/**
 * Example Component: Fetching and Displaying Courses from API
 * 
 * This component demonstrates proper data fetching in React for production.
 * It uses useEffect to fetch data after component mounts (not at build time).
 */

import { useState, useEffect } from 'react'
import { courseService } from '../services/adminApi'
import Card from './Card'
import toast from 'react-hot-toast'

function CoursesExample() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch data in useEffect (runs after component mounts, not at build time)
  useEffect(() => {
    loadCourses()
  }, []) // Empty dependency array = run once on mount

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('CoursesExample: Fetching courses...')
      
      // Call the service which uses axios
      const response = await courseService.getAll()
      
      console.log('CoursesExample: Response received:', response)
      
      // API returns { message, data } where data is the array
      // courseService.getAll() already extracts response.data from axios
      // So response is already { message, data }
      const coursesData = response?.data || response || []
      
      console.log('CoursesExample: Extracted courses data:', coursesData)
      console.log('CoursesExample: Is array?', Array.isArray(coursesData))
      console.log('CoursesExample: Courses count:', coursesData?.length || 0)
      
      // Ensure we have an array
      if (Array.isArray(coursesData)) {
        setCourses(coursesData)
      } else {
        console.warn('CoursesExample: Expected array but got:', typeof coursesData)
        setCourses([])
      }
    } catch (err) {
      console.error('CoursesExample: Error loading courses:', err)
      console.error('CoursesExample: Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      
      setError(err.response?.data?.message || err.message || 'Failed to load courses')
      toast.error(`שגיאה בטעינת המסלולים: ${err.response?.data?.message || err.message}`)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-lg text-neutral-600">טוען מסלולים...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-lg text-red-600 mb-4">שגיאה: {error}</p>
          <button
            onClick={loadCourses}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            נסה שוב
          </button>
        </div>
      </Card>
    )
  }

  if (courses.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-lg text-neutral-500">אין מסלולים זמינים</p>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">מסלולים ({courses.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course._id}>
            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
            {course.description && (
              <p className="text-neutral-600 text-sm mb-3">{course.description}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-primary-600">
                ₪{course.price?.toLocaleString() || 0}
              </span>
              {course.isActive !== undefined && (
                <span className={`px-2 py-1 text-xs rounded ${
                  course.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {course.isActive ? 'פעיל' : 'לא פעיל'}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default CoursesExample

