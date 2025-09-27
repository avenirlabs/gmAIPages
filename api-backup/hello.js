// Ultra-minimal test function using ES modules
export default function handler(req, res) {
  res.status(200).json({
    message: "Hello from Vercel!",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
}