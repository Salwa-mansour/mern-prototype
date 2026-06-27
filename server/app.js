import dotenv from 'dotenv';
dotenv.config(); 
import express from 'express';

import cookieParser from 'cookie-parser'; // ADDED: To read refresh tokens from cookies
import cors from 'cors'; // ADDED: To allow your frontend to talk to the API
import authRouter from './routes/authRouter.js';
import './config/passport.js';
const app = express();


const allowedOrigins = ['http://localhost:5173'];
const corsOptions = {
    origin:allowedOrigins, 
    credentials: true,                
    optionsSuccessStatus: 200         
};
// app.use(cors({ origin: `http://localhost:${process.env.urlPORT || 3000}`, credentials: true })); // ADJUSTED: for frontend communication
app.use(cors(corsOptions));
app.use(express.json()); // ADJUSTED: To handle JSON API requests instead of form-data only
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // ADDED: Crucial for HttpOnly cookie security
import passport from 'passport';
app.use(passport.initialize());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to the API server!" });
});
app.use("/auth", authRouter);

// The Global Error Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // Log the error locally on your server console so you can track bugs
    console.error(`💥 Error [${statusCode}]: ${err.message}`);

    // Return the response in a shape your frontend expects
    res.status(statusCode).json({
        status: 'error',
        error: err.message || 'Internal Server Error' // 💡 Changed from 'message' to 'error' to match your old controllers
    });
});

 //------------------end of routes--------------
app.use('/{*splat}', async (req, res) => {
    // *splat matches any path without the root path. If you need to match the root path as well /, you can use /{*splat}, wrapping the wildcard in braces.
    //res.sendFile(path.join(__dirname,'views','404.html'))
      res.status("404").json( { message: `path ${req.originalUrl} not found ` } );
  });
 
 const PORT = process.env.PORT || 3000;
 app.listen(PORT, (error) => {
   if (error) {
     throw error;
   }
   console.log(`Express app listening on port ${PORT}!`);
 });