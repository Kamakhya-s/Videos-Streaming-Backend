import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

const app=express();

// const allowedOrigins = [
//     'http://localhost:3000',
//     'http://localhost:5173',
//     'https://your-frontend-domain.com',
//     '*'
//   ];
  
//   const corsOptions = {
//     origin: function(origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         var msg = 'The CORS policy for this site does not ' +
//                   'allow access from the specified Origin.';
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     preflightContinue: false,
//     optionsSuccessStatus: 204
//   };
  
//   app.use(cors(corsOptions));

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({
    limit:"50mb"
}))

app.use(express.urlencoded({extended:true,limit:"50mb"}))

app.use(express.static("public"))

app.use(cookieParser());

app.use(morgan("dev"));

app.use("/", (req, res) => {
  res.send({ message: "Welcome to youtube-twitter" });
});


//routes import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routers.js"
import tweetRouter from "./routes/tweet.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js"
import subscriptionRouter from "./routes/subscription.routers.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import healthcheckRouter from "./routes/healthcheck.routers.js"


app.use("/api/v1/users",userRouter) 
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);


//https://localhost:8000/api/v1/users/register

export {app}