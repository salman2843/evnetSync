import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './src/config/db.js';

dotenv.config();

const port = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(port, () => console.log(`EventSync API listening on port ${port}`));
}).catch((error) => {
  console.error('Could not start EventSync API:', error.message);
  process.exit(1);
});
