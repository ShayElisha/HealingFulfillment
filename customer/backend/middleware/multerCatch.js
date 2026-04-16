export function catchMulterUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'הקובץ גדול מדי מהמותר. הקטן את הקובץ או העלה קובץ קטן יותר.',
        })
      }
      if (err.name === 'MulterError') {
        return res.status(400).json({
          message: err.message || 'שגיאה בהעלאת הקובץ (Multipart)',
        })
      }
      return res.status(400).json({
        message: err.message || 'שגיאה בהעלאת הקובץ',
      })
    })
  }
}
