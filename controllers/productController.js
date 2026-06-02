import Product from '../models/Product.js'
import { uploadImage } from '../utils/cloudinary.js'

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function getProducts(req, res, next) {
  try {
    const { bestSeller, category, featured, search } = req.query
    const filter = { isActive: true }

    if (category) filter.category = category
    if (featured) filter.featured = featured === 'true'
    if (bestSeller) filter.bestSeller = bestSeller === 'true'
    if (search) filter.name = { $regex: search, $options: 'i' }

    const products = await Product.find(filter).sort({ createdAt: -1 })

    res.json(products)
  } catch (error) {
    next(error)
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      res.status(404)
      throw new Error('Product not found')
    }

    res.json(product)
  } catch (error) {
    next(error)
  }
}

export async function createProduct(req, res, next) {
  try {
    const { category, name, price } = req.body
    const bestSeller = req.body.bestSeller === 'true' || req.body.bestSeller === true

    if (!name || !price || !category) {
      res.status(400)
      throw new Error('Name, price, and category are required')
    }

    const imageUrl = await uploadImage(req.file)

    if (!imageUrl) {
      res.status(400)
      throw new Error('Product image is required')
    }

    const product = await Product.create({
      bestSeller,
      category,
      featured: bestSeller,
      imageUrl,
      images: [imageUrl],
      name,
      price,
      slug: `${slugify(name)}-${Date.now()}`,
    })

    res.status(201).json(product)
  } catch (error) {
    next(error)
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      res.status(404)
      throw new Error('Product not found')
    }

    product.name = req.body.name ?? product.name
    product.slug = req.body.name ? slugify(req.body.name) : product.slug
    product.description = req.body.description ?? product.description
    product.price = req.body.price ?? product.price
    product.category = req.body.category ?? product.category
    if (req.body.bestSeller !== undefined) {
      const bestSeller = req.body.bestSeller === 'true' || req.body.bestSeller === true
      product.bestSeller = bestSeller
      product.featured = bestSeller
    }
    product.isActive = req.body.isActive ?? product.isActive

    if (req.body.sizes) product.sizes = parseList(req.body.sizes)

    if (req.file) {
      const imageUrl = await uploadImage(req.file)
      product.imageUrl = imageUrl
      product.images = [imageUrl]
    }

    const updatedProduct = await product.save()

    res.json(updatedProduct)
  } catch (error) {
    next(error)
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      res.status(404)
      throw new Error('Product not found')
    }

    product.isActive = false
    await product.save()

    res.json({ message: 'Product removed' })
  } catch (error) {
    next(error)
  }
}
