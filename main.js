const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mydb = require('./db/index');
require('dotenv').config()
const auth = require('./auth/auth');
const bcrypt = require('bcrypt');
const app = express();
const routes = require('./routes/routes.js');

const PORT = process.env.PORT || 8080;

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit:"50mb" }));
app.use(cors({
  //origin : 'https://realbaufront.herokuapp.com', 
  origin: 'http://127.0.0.1:5500',
  // origin: 'http://localhost:3000',
  credentials: true,
}));
/*app.use((req, res, next) => {
  Auth.verifyToken(req, res, next);
});*/
app.use((req, res, next) => auth.verifyToken(req,res,next));
app.use("/", routes);

app.listen(PORT , ()=>{
    console.log("listening on port " + PORT);
})


