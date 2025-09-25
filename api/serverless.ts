import serverless from 'serverless-http';
import { createServer } from '../server/index';

// Note: Vercel automatically provides environment variables from dashboard
// No need to load dotenv in serverless functions

const app = createServer();

export default serverless(app);