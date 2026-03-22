import dotenv from 'dotenv';
// dotenv must run before importing app so .env doesn't override test env vars
// that globalSetup injects into process.env before workers are forked.
dotenv.config({ override: true });

import { app } from './app';

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`🚀 Todo service running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
