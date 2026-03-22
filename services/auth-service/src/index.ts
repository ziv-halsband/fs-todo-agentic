import dotenv from 'dotenv';

dotenv.config({ override: true });

import { app } from './app';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Auth service running on port ${port}`);
  // eslint-disable-next-line no-console
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
