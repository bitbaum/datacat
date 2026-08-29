#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('\n🚀 Starting all development servers...\n');

// Start concurrently with both servers
const dev = spawn(
  'npx',
  [
    'concurrently',
    '-k',
    '-n',
    'FRONTEND,BACKEND',
    '-c',
    'blue,green',
    '"cd frontend && npm run dev"',
    '"cd backend && npm start"',
  ],
  {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  },
);

// Wait a bit for servers to start, then show links
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('🔗 DEVELOPMENT SERVERS RUNNING:');
  console.log('='.repeat(50));
  console.log('');
  console.log('📱 Frontend (Next.js):  http://localhost:3000');
  console.log('⚙️  Backend (Express):   http://localhost:5000');
  console.log('');
  console.log('='.repeat(50));
  console.log('Press Ctrl+C to stop all servers');
  console.log('='.repeat(50) + '\n');
}, 4000);

dev.on('close', (code) => {
  console.log(`\n✅ Development servers stopped (code ${code})`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping all development servers...');
  dev.kill('SIGINT');
});
