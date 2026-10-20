import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://klrhszlrlxuiftvnvrua.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscmhzemxybHh1aWZ0dm52cnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTcxNzEsImV4cCI6MjEwODA3MzE3MX0.oGnkLQQDQjv38Yov9oc5Cg4H1qF_jk0wwJ3JzlXQABE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Reading equipment data from equipmentData.js...');
  const filePath = path.join(__dirname, '../src/data/equipmentData.js');
  const content = fs.readFileSync(filePath, 'utf-8');

  const s = content.indexOf('const DEFAULT_EQUIPMENT_ITEMS = [') + 'const DEFAULT_EQUIPMENT_ITEMS = '.length;
  const e = content.indexOf('];\n\nconst STORAGE_KEY', s);
  const items = JSON.parse(content.substring(s, e + 1));

  console.log(`Found ${items.length} master equipment items.`);

  const mapped = items.map((item) => ({
    id: item.id,
    tag_code: item.tagCode,
    name: item.name,
    category: item.category || 'Equipment & Apparatus',
    lab: item.lab,
    stock: Number(item.stock) || 1,
    status: item.status || 'Passed Inspection',
    condition: item.condition || 'Functional',
    unit: item.unit || 'pc',
    description: item.description || '',
    ched_req: item.chedReq || '',
    room: item.room || '',
    safety_clearance: item.safetyClearance || 'Safe for Use',
    image: item.image || null,
    is_damaged: Boolean(item.isDamaged),
  }));

  // Batch upsert in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    console.log(`Upserting chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} items)...`);
    const { error } = await supabase.from('equipment').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error in chunk ${i}:`, error.message);
      process.exit(1);
    }
  }

  // Verify total count
  const { count, error } = await supabase.from('equipment').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Count check failed:', error);
  } else {
    console.log(`\n🎉 SUCCESS! Equipment table seeded. Total items in Supabase: ${count}`);
  }
}

seed();
