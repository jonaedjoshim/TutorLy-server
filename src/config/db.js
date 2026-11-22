const mongoose = require('mongoose');
const { env } = require('./env');

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[db] connected to ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
