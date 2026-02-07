require("dotenv").config();
const mongoose = require("mongoose");
// "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\Program Files\MongoDB\Server\8.2\data" --replSet rs0

const connectDB = async () => {
  try {
    console.log(
      process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/luxewave?replicaSet=rs0",
    );
    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/luxewave?replicaSet=rs0",
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        family: 4, // use ipv4
      },
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log(error);
    console.error(`MongoDB Connection Error: ${error.message}`);

    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
