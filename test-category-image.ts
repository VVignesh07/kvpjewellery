import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function testCategoryImages() {
    console.log('🔍 Checking recent categories...\n');

    const { data, error } = await supabase
        .from('categories')
        .select('id, name, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️ No categories found');
        return;
    }

    console.log(`✅ Found ${data.length} categories:\n`);

    data.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}`);
        console.log(`   ID: ${cat.id}`);
        console.log(`   Image URL: ${cat.image_url || '❌ NO IMAGE URL'}`);
        console.log(`   Has Image: ${cat.image_url ? '✅ YES' : '❌ NO'}`);
        console.log('');
    });

    // Test if we can fetch image URLs
    const categoriesWithImages = data.filter(c => c.image_url);
    console.log(`\n📊 Summary:`);
    console.log(`   Total categories: ${data.length}`);
    console.log(`   With images: ${categoriesWithImages.length}`);
    console.log(`   Without images: ${data.length - categoriesWithImages.length}`);
}

testCategoryImages();
