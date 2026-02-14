const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envFile = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkNecklaces() {
    console.log('🔍 Checking Necklaces category...');
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, image_url')
        .ilike('name', 'Necklaces');

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

checkNecklaces();
