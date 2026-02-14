import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCategories() {
    console.log('🔍 Querying categories table...');
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, image_url, is_active')
        .order('name');

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ Categories found:', data?.length);
        console.log(JSON.stringify(data, null, 2));
    }
}

debugCategories();
