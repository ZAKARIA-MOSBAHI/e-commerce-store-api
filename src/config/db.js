require("dotenv").config();
const mongoose = require("mongoose");
// "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\Program Files\MongoDB\Server\8.2\data" --replSet rs0

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/luxewave?replicaSet=rs0",
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
