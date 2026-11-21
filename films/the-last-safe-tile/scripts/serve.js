// Launch the preview: node scripts/serve.js [port]  → open the printed URL in a browser.
import { serve } from './lib/server.js';
const { port } = await serve(+(process.argv[2] || 8173));
console.log(`THE LAST SAFE TILE preview: http://127.0.0.1:${port}/index.html  (add ?seed=N to pick a run)`);
