// Quick test script to check categories in database
import { supabaseAdmin } from './src/lib/supabaseAdminClient.ts';

async function checkCategories() {
    console.log('🔍 Checking categories in database...\n');

    const { data, error } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug, image_url')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching categories:', error);
        return;
    }

    console.log(`Found ${data?.length || 0} categories:\n`);

    data?.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (${cat.slug})`);
        console.log(`   ID: ${cat.id}`);
        console.log(`   Image URL: ${cat.image_url || '❌ NO IMAGE URL'}`);
        console.log('');
    });

    const withImages = data?.filter(c => c.image_url) || [];
    const withoutImages = data?.filter(c => !c.image_url) || [];

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Categories with images: ${withImages.length}`);
    console.log(`   ❌ Categories without images: ${withoutImages.length}`);

    if (withImages.length > 0) {
        console.log(`\n📸 Sample image URLs:`);
        withImages.slice(0, 3).forEach(cat => {
            console.log(`   ${cat.name}: ${cat.image_url}`);
        });
    }
}

checkCategories().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
