import multer from 'multer'

function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
    return
  }

  cb(new Error('Only image uploads are allowed'))
}

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
})
