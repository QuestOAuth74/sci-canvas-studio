import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables:");
  console.error("- VITE_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("- SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "✓" : "✗");
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Icon categories seed data
const iconCategories = [
  { id: "bioicons-chemistry", name: "Bioicons - Chemistry" },
  { id: "bioicons-biology", name: "Bioicons - Biology" },
  { id: "bioicons-physics", name: "Bioicons - Physics" },
  { id: "bioicons-medical", name: "Bioicons - Medical" },
  { id: "cells", name: "Cells & Organelles" },
  { id: "molecules", name: "Molecules & Proteins" },
  { id: "lab", name: "Lab Equipment" },
  { id: "anatomy", name: "Anatomy" },
  { id: "plants", name: "Plants" },
  { id: "animals", name: "Animals" },
  { id: "symbols", name: "Symbols & Arrows" },
  { id: "other", name: "Other" },
];

// Sample testimonials seed data
const testimonials = [
  {
    name: "Dr. Sarah Chen",
    country: "United States",
    scientific_discipline: "Molecular Biology",
    message:
      "BioSketch has transformed how I create figures for my papers. The interface is intuitive and the icon library is comprehensive. Highly recommend!",
    rating: 5,
    is_approved: true,
  },
  {
    name: "Miguel Rodriguez",
    country: "Spain",
    scientific_discipline: "Neuroscience",
    message:
      "Finally, a free tool that actually works well! I have been using it for all my presentations and the results look professional.",
    rating: 5,
    is_approved: true,
  },
  {
    name: "Dr. Priya Patel",
    country: "India",
    scientific_discipline: "Biochemistry",
    message:
      "As a graduate student on a tight budget, BioSketch is a lifesaver. The quality is amazing for a free tool.",
    rating: 5,
    is_approved: true,
  },
  {
    name: "James Wilson",
    country: "United Kingdom",
    scientific_discipline: "Immunology",
    message:
      "Great tool for creating publication-quality figures. Saves me hours compared to other software.",
    rating: 4,
    is_approved: true,
  },
  {
    name: "Dr. Li Wei",
    country: "China",
    scientific_discipline: "Cell Biology",
    message:
      "The drag and drop feature makes it so easy to design complex diagrams. Thank you for making this free!",
    rating: 5,
    is_approved: true,
  },
  {
    name: "Emma Thompson",
    country: "Canada",
    scientific_discipline: "Genetics",
    message:
      "Simple, effective, and free. Everything a researcher needs for creating scientific illustrations.",
    rating: 5,
    is_approved: true,
  },
  {
    name: "Dr. Ahmed Hassan",
    country: "Egypt",
    scientific_discipline: "Microbiology",
    message:
      "I use BioSketch for all my teaching materials. My students love the clear, professional diagrams.",
    rating: 4,
    is_approved: true,
  },
  {
    name: "Sofia Martinez",
    country: "Argentina",
    scientific_discipline: "Bioinformatics",
    message:
      "The best free alternative for scientific illustration. Clean interface and great icon selection.",
    rating: 5,
    is_approved: true,
  },
  {
    name: "Dr. Thomas Müller",
    country: "Germany",
    scientific_discipline: "Pharmacology",
    message:
      "Excellent tool for creating figures quickly. The export quality is perfect for journals.",
    rating: 5,
    is_approved: true,
  },
];

// Admin user email to grant admin role
const ADMIN_EMAIL = "quarde@yahoo.com";

async function seedIconCategories() {
  console.log("Seeding icon categories...");

  const { error } = await supabase.from("icon_categories").upsert(iconCategories, {
    onConflict: "id",
  });

  if (error) {
    console.error("Error seeding icon categories:", error.message);
    return false;
  }

  console.log(`✓ Seeded ${iconCategories.length} icon categories`);
  return true;
}

async function seedTestimonials() {
  console.log("Seeding testimonials...");

  // Check if testimonials already exist
  const { count } = await supabase
    .from("testimonials")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    console.log(`✓ Testimonials already exist (${count} found), skipping...`);
    return true;
  }

  const { error } = await supabase.from("testimonials").insert(testimonials);

  if (error) {
    console.error("Error seeding testimonials:", error.message);
    return false;
  }

  console.log(`✓ Seeded ${testimonials.length} testimonials`);
  return true;
}

async function seedAdminRole() {
  console.log(`Granting admin role to ${ADMIN_EMAIL}...`);

  // Find user by email using auth.users (requires service role)
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error("Error listing users:", userError.message);
    return false;
  }

  const adminUser = users.users.find((u) => u.email === ADMIN_EMAIL);

  if (!adminUser) {
    console.log(`⚠ User ${ADMIN_EMAIL} not found, skipping admin role assignment`);
    return true;
  }

  // Insert admin role (upsert to avoid conflicts)
  const { error } = await supabase.from("user_roles").upsert(
    {
      user_id: adminUser.id,
      role: "admin",
    },
    {
      onConflict: "user_id,role",
    }
  );

  if (error) {
    console.error("Error granting admin role:", error.message);
    return false;
  }

  console.log(`✓ Granted admin role to ${ADMIN_EMAIL}`);
  return true;
}

async function main() {
  console.log("Starting database seed...\n");
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  let success = true;

  success = (await seedIconCategories()) && success;
  success = (await seedTestimonials()) && success;
  success = (await seedAdminRole()) && success;

  console.log("");
  if (success) {
    console.log("✓ Database seeding completed successfully!");
  } else {
    console.error("✗ Database seeding completed with errors");
    process.exit(1);
  }
}

main();
