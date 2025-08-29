const express= require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/dbconnect');
const bodyParser = require('body-parser');
const  authRoute =require('./routes/authRoute');
const chatRoute = require('./routes/chatRoute');


dotenv.config();

const PORT = process.env.PORT;
const app= express();

// middleware
app.use(express.json()) //parse body data
app.use(cookieParser())  //parse token of ever req
app.use(bodyParser.urlencoded({extended:true}));


// database connection
connectDb();

// test route
app.get("/home", (req, res) => {
  res.send("Server is running ✅");
});


// routes
app.use('/api/auth',authRoute)

app.use('/api/chat',chatRoute)

app.listen(PORT,()=>{
    console.log(`server running in this port ${PORT}`)
});