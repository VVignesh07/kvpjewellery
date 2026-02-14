
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmuqiamcykrbpucjzvhv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdXFpYW1jeWtyYnB1Y2p6dmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzIxMzcsImV4cCI6MjA4NjM0ODEzN30.bcdIxQBdtepcy7NXnLZe6RNye57S58WaiTYiBmL-q2g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const slides = [
    {
        image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?q=80&w=2070&auto=format&fit=crop',
        title: 'Exquisite Bridal Necklaces',
        subtitle: 'Discover our signature collection of handcrafted gold and diamond bridal sets.',
        button_text: 'VIEW COLLECTION',
        button_link: '/shop?category=Necklace',
        display_order: 1,
        is_active: true
    },
    {
        image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop',
        title: 'The Diamond Gallery',
        subtitle: 'Timeless diamond rings and solitaires for your most precious moments.',
        button_text: 'SHOP RINGS',
        button_link: '/shop?category=Ring',
        display_order: 2,
        is_active: true
    },
    {
        image_url: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=1964&auto=format&fit=crop',
        title: 'Grand Earrings Collection',
        subtitle: 'From traditional jhumkas to modern studs, find your perfect sparkle.',
        button_text: 'EXPLORE EARRINGS',
        button_link: '/shop?category=Earrings',
        display_order: 3,
        is_active: true
    },
    {
        image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop',
        title: 'Golden Bangles & Bracelets',
        subtitle: 'Artistic 22k gold bangles that blend tradition with contemporary design.',
        button_text: 'SHOP BANGLES',
        button_link: '/shop?category=Bangles',
        display_order: 4,
        is_active: true
    },
    {
        image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1974&auto=format&fit=crop',
        title: 'Luxury Temple Jewellery',
        subtitle: 'Sacred art in gold. Explore our intricate temple jewellery collection.',
        button_text: 'DISCOVER NOW',
        button_link: '/shop?category=Necklace',
        display_order: 5,
        is_active: true
    }
];

async function seed() {
    console.log('Clearing existing slides...');
    const { error: deleteError } = await supabase
        .from('hero_slides')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
        console.error('Error clearing slides:', deleteError);
    }

    console.log('Inserting new premium slides...');
    const { data, error } = await supabase
        .from('hero_slides')
        .insert(slides);

    if (error) {
        console.error('Error inserting slides:', error);
    } else {
        console.log('Successfully seeded 5 premium slides!');
    }
}

seed();
