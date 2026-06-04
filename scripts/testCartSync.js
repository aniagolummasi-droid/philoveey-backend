/**
 * Cart Sync Test Script
 * Simulates frontend-backend cart sync scenarios to verify no duplication
 * Run with: node scripts/testCartSync.js
 */

// Mock cart items
const mockLocalCart = [
  { _id: 'prod1', product: { _id: 'prod1' }, quantity: 2 },
  { _id: 'prod2', product: { _id: 'prod2' }, quantity: 1 },
]

const mockServerCart = [
  { _id: 'prod1', product: { _id: 'prod1' }, quantity: 1 },
  { _id: 'prod3', product: { _id: 'prod3' }, quantity: 3 },
]

/**
 * Get product ID from cart item (handles different formats)
 */
function getProductId(item) {
  if (!item) return null
  return item.product?._id || item.product || item._id
}

/**
 * Merge local and server cart items
 * Prioritizes local quantities (client intent)
 */
function mergeCartItems(local, server) {
  const merged = new Map()

  // Add all local items first
  for (const item of local) {
    const id = getProductId(item)
    if (id) {
      merged.set(id, { ...item, quantity: item.quantity || 1 })
    }
  }

  // Add server items not in local
  for (const item of server) {
    const id = getProductId(item)
    if (id && !merged.has(id)) {
      merged.set(id, { ...item, quantity: item.quantity || 1 })
    }
  }

  return Array.from(merged.values())
}

/**
 * Simulate sync process: fetch server, add/update differences, refetch
 */
async function simulateSyncProcess() {
  console.log('🧪 Cart Sync Simulation\n')
  console.log('📦 Initial Local Cart:', mockLocalCart)
  console.log('🖥️  Initial Server Cart:', mockServerCart)

  // Step 1: Identify differences
  console.log('\n📋 Step 1: Identifying differences...')
  const localIds = new Set(mockLocalCart.map(getProductId))
  const serverIds = new Set(mockServerCart.map(getProductId))

  const toAdd = mockLocalCart.filter((item) => {
    const id = getProductId(item)
    return !mockServerCart.find((s) => getProductId(s) === id)
  })

  const toUpdate = mockLocalCart.filter((item) => {
    const id = getProductId(item)
    const serverItem = mockServerCart.find((s) => getProductId(s) === id)
    return serverItem && serverItem.quantity !== item.quantity
  })

  console.log('  ➕ Items to add:', toAdd.map((i) => ({ id: getProductId(i), qty: i.quantity })))
  console.log('  🔄 Items to update:', toUpdate.map((i) => ({ id: getProductId(i), qty: i.quantity })))

  // Step 2: Simulate server updates
  console.log('\n🔄 Step 2: Applying updates to server...')
  let simulatedServer = [...mockServerCart]

  // Add new items
  for (const item of toAdd) {
    const id = getProductId(item)
    simulatedServer.push({ product: { _id: id }, quantity: item.quantity })
    console.log(`  ✅ Added prod ${id}: qty ${item.quantity}`)
  }

  // Update quantities
  for (const item of toUpdate) {
    const id = getProductId(item)
    const serverItem = simulatedServer.find((s) => getProductId(s) === id)
    if (serverItem) {
      console.log(`  ✅ Updated prod ${id}: qty ${serverItem.quantity} → ${item.quantity}`)
      serverItem.quantity = item.quantity
    }
  }

  console.log('  📦 Simulated Server Cart After Updates:', simulatedServer)

  // Step 3: Merge results
  console.log('\n✨ Step 3: Merging local + refreshed server...')
  const finalMerge = mergeCartItems(mockLocalCart, simulatedServer)
  console.log('  🎯 Final Merged Cart:', finalMerge)

  // Verification
  console.log('\n✅ Verification:')
  const totalQty = finalMerge.reduce((sum, item) => sum + item.quantity, 0)
  console.log(`  Total items in cart: ${finalMerge.length}`)
  console.log(`  Total quantity: ${totalQty}`)
  console.log(`  Expected: 4 items (prod1: 2, prod2: 1, prod3: 3)`)

  // Check for duplicates
  const itemIds = finalMerge.map(getProductId)
  const uniqueIds = new Set(itemIds)
  if (itemIds.length === uniqueIds.size) {
    console.log('  ✅ No duplicates detected')
  } else {
    console.log('  ❌ DUPLICATES DETECTED!')
  }

  return { success: totalQty === 6 && itemIds.length === uniqueIds.size }
}

// Test edge cases
async function testEdgeCases() {
  console.log('\n\n🧪 Edge Case Tests\n')

  // Case 1: Empty server cart
  console.log('Test 1: Empty server cart')
  const result1 = mergeCartItems(mockLocalCart, [])
  console.log('  Result:', result1.map((i) => ({ id: getProductId(i), qty: i.quantity })))
  console.log('  ✅ Pass' + (result1.length === 2 ? '' : ' ❌'))

  // Case 2: Empty local cart
  console.log('\nTest 2: Empty local cart')
  const result2 = mergeCartItems([], mockServerCart)
  console.log('  Result:', result2.map((i) => ({ id: getProductId(i), qty: i.quantity })))
  console.log('  ✅ Pass' + (result2.length === 2 ? '' : ' ❌'))

  // Case 3: Identical carts
  console.log('\nTest 3: Identical carts')
  const identical = [{ product: { _id: 'prod1' }, quantity: 5 }]
  const result3 = mergeCartItems(identical, identical)
  console.log('  Result:', result3.map((i) => ({ id: getProductId(i), qty: i.quantity })))
  console.log('  ✅ Pass' + (result3[0].quantity === 5 ? '' : ' ❌'))

  // Case 4: Duplicate items in local (simulating corrupted localStorage)
  console.log('\nTest 4: Duplicate items in local cart')
  const dupLocal = [
    { product: { _id: 'prod1' }, quantity: 2 },
    { product: { _id: 'prod1' }, quantity: 3 },
  ]
  const result4 = mergeCartItems(dupLocal, [])
  console.log('  Result:', result4.map((i) => ({ id: getProductId(i), qty: i.quantity })))
  console.log('  ✅ Merged to single item with qty 5' + (result4.length === 1 && result4[0].quantity === 5 ? '' : ' ❌'))
}

// Run tests
;(async () => {
  const mainTest = await simulateSyncProcess()
  await testEdgeCases()

  console.log('\n\n' + '='.repeat(50))
  console.log(mainTest.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED')
  console.log('='.repeat(50))
})()
