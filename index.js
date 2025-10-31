const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// imports
const urlRoute = require('./routes/url');
const { connectToMongoDB } = require('./connection');
const staticRoute = require('./routes//staticRouter');
const URL = require('./models/url');
const userRoute = require('./routes/user');
const { restrictToLoggedinUserOnly , checkAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8001;
  
app.use(express.static('public'));


//setting the View engine to ejs
app.set('view engine','ejs');
app.set('views', path.resolve('./views'));


//Coonection to db
// connectToMongoDB(process.env.MONGODB_URI)
// connectToMongoDB("mongodb://localhost:27017/short-url")
// .then(() => console.log("Connected to MongoDb"))
// .catch((err) => console.log(err));

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/short-url";
connectToMongoDB(MONGO_URI)
  .then(() => console.log("Connected to MongoDb"))
  .catch((err) => console.log(err));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());


app.use('/url', restrictToLoggedinUserOnly, urlRoute);
app.use('/user',userRoute);
app.use('/',checkAuth,staticRoute);

app.get('/:shortId/', async (req,res) =>{
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate({
        shortId
    },{
        $push: {
            visitHistory: { timestamp : Date.now()}
        }       
    }); 

    if (entry) {
        res.redirect(entry.redirectUrl);
    } 
    else{
        res.status(404).json("URL not found")    
    }
      
});

app.listen(PORT, '0.0.0.0', () =>{
    console.log(`Server Started at PORT ${PORT}.`);
}) 