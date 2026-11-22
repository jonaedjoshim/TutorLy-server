const dns = require('node:dns');
const mongoose = require('mongoose');
const { env } = require('./env');

// Use public resolvers: some networks refuse MongoDB Atlas SRV lookups.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[db] connected to ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
