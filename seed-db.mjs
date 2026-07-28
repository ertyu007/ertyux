import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wjdphuvbhgnczbjabddw.supabase.co'
const supabaseAnonKey = 'sb_publishable_8Fb0w4joNURJPvFFjKVPuA_DpPaBWDE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedData() {
  console.log("Attempting to insert data...");
  const { data, error } = await supabase.from('projects').insert([
    {
      title: 'Cyberpunk E-Commerce (Real Data)',
      description: 'A fully functional 3D e-commerce store with AR capabilities.',
      image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      demo_link: '#',
      github_link: '#',
      likes_count: 142
    },
    {
      title: 'Neon Task Manager (Real Data)',
      description: 'Productivity app with a retro-futuristic synthwave aesthetic.',
      image_url: 'https://images.unsplash.com/photo-1614729939124-03290b56c9ce?auto=format&fit=crop&q=80&w=800',
      demo_link: '#',
      github_link: '#',
      likes_count: 89
    }
  ]).select();
  
  if (error) {
    console.error("Insert Error:", error.message);
  } else {
    console.log("Insert Success! Real UUIDs generated:", data.map(d => d.id));
  }
}
seedData();
