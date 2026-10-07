import { createApp } from './app.js';

const port = Number(process.env.PORT || 3000);
const server = createApp().listen(port, '0.0.0.0', () => {
  console.log(`File Upload API v1.0.0: http://localhost:${port}`);
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
