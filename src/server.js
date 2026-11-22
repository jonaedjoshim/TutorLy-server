const dns = require('node:dns');

// Use public resolvers: some networks refuse MongoDB Atlas SRV lookups.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = require('./app');
const connectDB = require('./config/db');
const { env } = require('./config/env');

const start = async () => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`[api] Tutorly API listening on port ${env.port} [${env.nodeEnv}]`);
  });
};

start().catch((error) => {
  console.error('[api] failed to start', error);
  process.exit(1);
});
