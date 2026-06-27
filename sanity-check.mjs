import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('FAIL  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, key, { realtime: { transport: ws } })

let allPassed = true

function pass(label) { console.log(`  PASS  ${label}`) }
function fail(label, err) { console.error(`  FAIL  ${label}: ${err}`); allPassed = false }

// 1. Read items (RLS select policy)
console.log('\n[1] items table — select')
try {
  const { data, error } = await supabase.from('items').select('*').limit(1)
  if (error) fail('select items', error.message)
  else pass(`select items (${data.length} rows returned)`)
} catch (e) { fail('select items', e.message) }

// 2. Insert a test item then clean it up (RLS insert policy)
console.log('\n[2] items table — insert + delete')
let testItemId
try {
  const { data, error } = await supabase
    .from('items')
    .insert({ image_url: 'https://sanity-check', lat: 52.52, lng: 13.405 })
    .select('id')
    .single()
  if (error) fail('insert item', error.message)
  else {
    testItemId = data.id
    pass(`insert item (id: ${testItemId})`)
  }
} catch (e) { fail('insert item', e.message) }

if (testItemId) {
  try {
    const { error } = await supabase.from('items').delete().eq('id', testItemId)
    if (error) fail('cleanup test item', error.message)
    else pass('cleanup test item')
  } catch (e) { fail('cleanup test item', e.message) }
}

// 3. Insert a test flag (RLS insert policy on flags)
console.log('\n[3] flags table — insert')
if (testItemId) {
  // testItemId was deleted, so use a dummy uuid — we just want to confirm the policy allows insert
  // (it will fail with FK violation, not RLS violation — that's the right outcome)
  const { error } = await supabase
    .from('flags')
    .insert({ item_id: '00000000-0000-0000-0000-000000000000' })
  if (error && error.message.includes('foreign key')) {
    pass('insert flag (FK violation = RLS is open, table exists)')
  } else if (error && error.message.includes('row-level security')) {
    fail('insert flag', 'blocked by RLS — check "Anyone can insert flags" policy')
  } else if (error) {
    fail('insert flag', error.message)
  } else {
    pass('insert flag')
  }
} else {
  console.log('  SKIP  flags insert (items insert failed)')
}

// 4. Storage bucket exists and is public
console.log('\n[4] storage — item-images bucket')
try {
  const { data, error } = await supabase.storage.from('item-images').list('', { limit: 1 })
  if (error) fail('list item-images bucket', error.message)
  else pass('item-images bucket accessible')
} catch (e) { fail('item-images bucket', e.message) }

// 5. Storage upload (anon upload policy)
console.log('\n[5] storage — anon upload')
try {
  const blob = new Blob(['sanity'], { type: 'image/jpeg' })
  const { data, error } = await supabase.storage
    .from('item-images')
    .upload('sanity-check-delete-me.jpg', blob, { upsert: true })
  if (error) fail('upload to item-images', error.message)
  else {
    pass('upload to item-images')
    // clean up
    await supabase.storage.from('item-images').remove(['sanity-check-delete-me.jpg'])
  }
} catch (e) { fail('upload to item-images', e.message) }

console.log(allPassed ? '\nAll checks passed — Supabase is ready.\n' : '\nSome checks failed — see above.\n')
process.exit(allPassed ? 0 : 1)
