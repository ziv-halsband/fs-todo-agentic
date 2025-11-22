// Intentionally "bad" code to test our tools
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Missing type annotation
function greet(name: string) {
  console.log(`Hello ${name}`);
  return name.toUpperCase();
}

// Missing await``
async function getUser(id: string): Promise<{ id: string; name: string }> {
  const user = await Promise.resolve({ id, name: 'John' });
  return user;
}

app.get('/health', async (_req: Request, res: Response) => {
  const user = await getUser('123');
  console.log(greet(user.name));
  res.json({ status: 'ok', user });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
