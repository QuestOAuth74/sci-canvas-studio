import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load production env
const prodEnv = dotenv.config({ path: '.env' }).parsed;
const devEnv = dotenv.config({ path: '.env.local' }).parsed;

const LOGO_PATH = 'icon site/biosketch art-min.png';
const BUCKET_NAME = 'icon site';

async function checkAndSyncLogo() {
  if (!prodEnv || !devEnv) {
    console.error('Missing environment files');
    return;
  }

  // Create Supabase clients
  const prodSupabase = createClient(
    prodEnv.VITE_SUPABASE_URL!,
    prodEnv.VITE_SUPABASE_PUBLISHABLE_KEY!
  );

  const devSupabase = createClient(
    devEnv.VITE_SUPABASE_URL!,
    devEnv.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
  );

  console.log('🔍 Listing production storage buckets...');
  const { data: prodBuckets, error: prodBucketsError } = await prodSupabase.storage.listBuckets();

  if (prodBucketsError) {
    console.error('❌ Error listing production buckets:', prodBucketsError);
  } else {
    console.log('Production buckets:', prodBuckets?.map(b => `${b.name} (public: ${b.public})`));
  }

  console.log('\n🔍 Listing development storage buckets...');
  const { data: devBuckets, error: devBucketsError } = await devSupabase.storage.listBuckets();

  if (devBucketsError) {
    console.error('❌ Error listing development buckets:', devBucketsError);
  } else {
    console.log('Development buckets:', devBuckets?.map(b => `${b.name} (public: ${b.public})`));
  }

  console.log('\n🔍 Checking production storage for logo...');

  // Check if file exists in production
  const { data: prodFile, error: prodError } = await prodSupabase
    .storage
    .from(BUCKET_NAME)
    .download(LOGO_PATH);

  if (prodError) {
    console.error('❌ Error accessing production storage:', prodError);

    // Try to list files in the bucket
    console.log('\n🔍 Trying to list files in production bucket...');
    const { data: files, error: listError } = await prodSupabase
      .storage
      .from(BUCKET_NAME)
      .list('', { limit: 100 });

    if (listError) {
      console.error('❌ Error listing files:', listError);
    } else {
      console.log('Files in bucket:', files?.map(f => f.name));
    }

    return;
  }

  console.log('✅ Logo found in production storage');
  console.log(`   Size: ${prodFile.size} bytes`);

  console.log('\n🔍 Checking development storage...');

  // Check if file exists in development
  const { data: devFile, error: devError } = await devSupabase
    .storage
    .from(BUCKET_NAME)
    .download(LOGO_PATH);

  if (!devError && devFile) {
    console.log('✅ Logo already exists in development storage');
    console.log(`   Size: ${devFile.size} bytes`);
    return;
  }

  if (devError?.message.includes('not found') || devError?.message.includes('Object not found')) {
    console.log('⚠️  Logo not found in development storage');
    console.log('📤 Uploading logo to development storage...');

    // Upload to development
    const { data: uploadData, error: uploadError } = await devSupabase
      .storage
      .from(BUCKET_NAME)
      .upload(LOGO_PATH, prodFile, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Error uploading to development:', uploadError.message);

      // Check if bucket exists
      const { data: devBuckets } = await devSupabase.storage.listBuckets();
      console.log('Development buckets:', devBuckets?.map(b => b.name));

      // Try to create bucket if it doesn't exist
      if (!devBuckets?.find(b => b.name === BUCKET_NAME)) {
        console.log('📦 Creating bucket in development...');
        const { error: createError } = await devSupabase.storage.createBucket(BUCKET_NAME, {
          public: true
        });

        if (createError) {
          console.error('❌ Error creating bucket:', createError.message);
        } else {
          console.log('✅ Bucket created, retrying upload...');

          // Retry upload
          const { data: retryData, error: retryError } = await devSupabase
            .storage
            .from(BUCKET_NAME)
            .upload(LOGO_PATH, prodFile, {
              contentType: 'image/png',
              upsert: true
            });

          if (retryError) {
            console.error('❌ Retry failed:', retryError.message);
          } else {
            console.log('✅ Logo successfully uploaded to development!');
            console.log('   Path:', retryData.path);
          }
        }
      }

      return;
    }

    console.log('✅ Logo successfully uploaded to development!');
    console.log('   Path:', uploadData.path);

    // Get public URL
    const { data: publicUrlData } = devSupabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(LOGO_PATH);

    console.log('   Public URL:', publicUrlData.publicUrl);

  } else {
    console.error('❌ Error accessing development storage:', devError?.message);

    // List buckets to help debug
    const { data: devBuckets } = await devSupabase.storage.listBuckets();
    console.log('Development buckets:', devBuckets?.map(b => b.name));
  }
}

checkAndSyncLogo().catch(console.error);
