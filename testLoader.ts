import { config } from 'dotenv';
config({ path: '.env.local' });
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// Replace with your actual workspace UUID from the database
const TEST_WORKSPACE_ID = 'bc4f07f0-eab7-4e5e-ad85-dc389b53b838';

async function test() {
  // Import supabaseClient and workspaceLoader after dotenv config
  const { loadWorkspace } = await import('./lib/workspaceLoader.ts');
  const { useWorkspaceStore } = await import('./store/workspaceStore.ts');
  console.log('Testing loadWorkspace for workspace:', TEST_WORKSPACE_ID);
  await loadWorkspace(TEST_WORKSPACE_ID, () => {
    console.log('Workspace not found (404)');
  });
  // You can import your Zustand store and log its state here if needed
  const state = useWorkspaceStore.getState();
  console.log('Hydrated Zustand store:', state);
}

test().catch(console.error);
