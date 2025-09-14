const express= require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/dbconnect');
const bodyParser = require('body-parser');
const  authRoute =require('./routes/authRoute');
const chatRoute = require('./routes/chatRoute');
const http = require('http');
const initializeSocket = require('./services/socketService')
const statusRoute = require("./routes/statusRoute");

dotenv.config();

const PORT = process.env.PORT;
const app= express();


const corsOption ={
  origin:process.env.FRONTEND_URL,
  credentials :true
}

app.use(cors(corsOption));


// middleware
app.use(express.json()) //parse body data
app.use(cookieParser())  //parse token of ever req
app.use(bodyParser.urlencoded({extended:true}));

// database connection
connectDb();

// create server
const server = http.createServer(app)

const io = initializeSocket(server)

// apply socket middleware befroe routes
app.use((req,res,next)=>{
  req.io= io;
  req.socketUserMap = io.socketUserMap
  next();
})


// routes
app.use('/api/auth',authRoute)
app.use('/api/chats',chatRoute)
app.use('/api/status',statusRoute)

server.listen(PORT,()=>{
    console.log(`server running in this port ${PORT}`)
});