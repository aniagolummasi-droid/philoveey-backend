import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import Product from '../models/Product.js'

dotenv.config()

const products = [
  {
    category: 'Men',
    color: 'Black',
    description: 'Handmade black slide for everyday comfort.',
    featured: true,
    name: 'Classic Slide',
    price: 15000,
    sizes: ['40', '41', '42', '43', '44'],
    slug: 'classic-slide-black',
    stock: 20,
  },
  {
    category: 'Women',
    color: 'Tan',
    description: 'Signature cross slide with a clean handmade finish.',
    featured: true,
    name: 'Signature Cross Slide',
    price: 16000,
    sizes: ['37', '38', '39', '40', '41'],
    slug: 'signature-cross-slide-tan',
    stock: 20,
  },
  {
    category: 'Men',
    color: 'Black',
    description: 'Polished black loafer built for smart casual styling.',
    featured: true,
    name: 'Elite Loafer',
    price: 20000,
    sizes: ['40', '41', '42', '43', '44'],
    slug: 'elite-loafer-black',
    stock: 15,
  },
  {
    category: 'Unisex',
    color: 'Brown',
    description: 'Durable brown sandal with a comfortable handmade fit.',
    featured: false,
    name: 'Urban Sandal',
    price: 17000,
    sizes: ['38', '39', '40', '41', '42', '43'],
    slug: 'urban-sandal-brown',
    stock: 18,
  },
  {
    category: 'Women',
    color: 'Black',
    description: 'Block heel designed for comfort and confident movement.',
    featured: false,
    name: 'Block Heel',
    price: 18000,
    sizes: ['37', '38', '39', '40', '41'],
    slug: 'block-heel-black',
    stock: 12,
  },
]

async function seedProducts() {
  await connectDB()

  for (const product of products) {
    await Product.findOneAndUpdate({ slug: product.slug }, product, {
      new: true,
      upsert: true,
    })
  }

  console.log(`Seeded ${products.length} products`)
  process.exit(0)
}

seedProducts().catch((error) => {
  console.error(error)
  process.exit(1)
})
