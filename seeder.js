const fs = require("fs");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");
const Bootcamp = require("./models/Bootcamp");
const Course = require("./models/Course");
const Review = require("./models/Review");
const User = require("./models/User");
const path = require("path");

dotenv.config();

// connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// READ JSON FILES
const bootcamps = JSON.parse(
  fs.readFileSync(path.join(__dirname, "/data/bootcamps.json"), "utf-8")
);
const courses = JSON.parse(
  fs.readFileSync(path.join(__dirname, "/data/courses.json"), "utf-8")
);
const users = JSON.parse(
  fs.readFileSync(path.join(__dirname, "/data/users.json"), "utf-8")
);
const reviews = JSON.parse(
  fs.readFileSync(path.join(__dirname, "/data/reviews.json"), "utf-8")
);
// import to db 
const importData = async () => {
  try {
    await Bootcamp.create(bootcamps);
    await Course.create(courses);
    await User.create(users);
    await Review.create(reviews);
    console.log("Data imported successfully".green.inverse);
    process.exit(1);
  } catch (error) {
    console.log(err.red);
  }
};

// delete data
const deleteData = async () => {
  try {
    await Bootcamp.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data destroyed successfully".red.inverse);
    process.exit(1);
  } catch (error) {
    console.log(err);
  }
};

if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
}
