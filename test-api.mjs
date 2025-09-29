import health from './api/health.ts';
import catchall from './api/[...all].ts';
import chat from './api/gifts/chat.ts';
import diagnostics from './api/_diag/search-config.ts';

console.log('=== Testing /api/health ===');
const mockReq1 = { method: 'GET' };
const mockRes1 = {
  status: (code) => ({ json: (data) => console.log(`Status: ${code}, Response:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response:', JSON.stringify(data, null, 2))
};
health(mockReq1, mockRes1);

console.log('\n=== Testing /api/ping ===');
const mockReq2 = { method: 'GET', url: '/api/ping' };
const mockRes2 = {
  status: (code) => ({ json: (data) => console.log(`Status: ${code}, Response:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response:', JSON.stringify(data, null, 2))
};
catchall(mockReq2, mockRes2);

console.log('\n=== Testing /api/gifts/chat (POST with query) ===');
const mockReq4 = {
  method: 'POST',
  body: { query: 'mug', topK: 6, filters: { relation: ['Dad'], occasion: ['Birthday'] }, soft: false }
};
const mockRes4 = {
  status: (code) => ({ json: (data) => console.log(`Status: ${code}, Response:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
  setHeader: () => {},
  end: () => console.log('CORS preflight handled')
};
chat(mockReq4, mockRes4);

console.log('\n=== Testing /api/gifts/chat (GET - should fail) ===');
const mockReq5 = { method: 'GET' };
const mockRes5 = {
  status: (code) => ({ json: (data) => console.log(`Status: ${code}, Response:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
  setHeader: () => {}
};
chat(mockReq5, mockRes5);

console.log('\n=== Testing /api/_diag/search-config ===');
const mockReqDiag = { method: 'GET' };
const mockResDiag = {
  status: (code) => ({ json: (data) => console.log(`Status: ${code}, Response:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
  setHeader: () => {}
};
diagnostics(mockReqDiag, mockResDiag);

console.log('\n=== Testing /api/unknown ===');
const mockReq3 = { method: 'GET', url: '/api/unknown' };
const mockRes3 = {
  status: (code) => ({ json: (data) => console.log(`Status: ${code}, Response:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response:', JSON.stringify(data, null, 2))
};
catchall(mockReq3, mockRes3);