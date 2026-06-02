import { v2 as cloudinary } from 'cloudinary'

export function uploadImage(file) {
  if (!file) return Promise.resolve(null)

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary is not configured')
  }

  cloudinary.config({
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  })

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'philoveey/products',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        resolve(result.secure_url)
      },
    )

    stream.end(file.buffer)
  })
}
