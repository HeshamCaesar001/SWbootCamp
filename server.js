const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const bodyParser = require("body-parser");
const errorHandler = require("./middlewares/error.js");
const connectDB = require("./config/db");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
//Routes files
const bootcamps = require("./routes/bootcampsRoute");
const courses = require("./routes/coursesRoute");
const auth = require("./routes/auth");
const users = require("./routes/userRoutes.js");
const reviews = require("./routes/reviewRoute.js");

//load env vars
dotenv.config();
// Database connection
connectDB();
const app = express();
//body-parser
app.use(bodyParser.json());
// mongo sanitizer
app.use(mongoSanitize());
// helmet for express apps adding some secure headers that prevent(xss) and others
app.use(helmet());
app.use(xss());
//  enable CORS
app.use(cors());
// request rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 100,
});
app.use(limiter);
// prevent http param pollution
app.use(hpp());
// cookie parser
app.use(cookieParser());
// dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// File Uploading
app.use(fileupload());

//set static folder
app.use(express.static(path.join(__dirname, "public")));

// app routes
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MODE = process.env.NODE_ENV;
const server = app.listen(PORT, () => {
  console.log(`server running in ${MODE}  Mode on Port  ${PORT}`.yellow.bold);
});

process.on("unHandleRejection", (err, promise) => {
  console.log(`Error: ${err.message} `);
  server.close(() => {
    process.exit(1);
  });
});
