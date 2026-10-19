import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 ReconX-AI Backend running on port ${config.port}`);
  console.log(`📖 Swagger API Docs: http://localhost:${config.port}/api/docs`);
  console.log(`⚡ Environment: ${config.nodeEnv}`);
  console.log(`====================================================`);
});
