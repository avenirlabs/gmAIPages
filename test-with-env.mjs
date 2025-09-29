import 'dotenv/config';
import diagnostics from './api/_diag/search-config.ts';
import chat from './api/gifts/chat.ts';

console.log('=== Testing diagnostics ===');
const diagReq = { method: 'GET' };
const diagRes = {
  status: (code) => ({ json: (data) => console.log(`Status: ${code}, Response:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
  setHeader: () => {}
};
diagnostics(diagReq, diagRes);

console.log('\n=== Testing chat ===');
const chatReq = {
  method: 'POST',
  body: { query: 'mug for dad', topK: 8 }
};
const chatRes = {
  status: (code) => ({ json: (data) => console.log(`Status: ${code}, Response:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
  setHeader: () => {},
  end: () => console.log('CORS preflight handled')
};
chat(chatReq, chatRes);