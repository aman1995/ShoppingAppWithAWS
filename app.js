const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config/database');
const pages = require('./routes/pages.js');
const adminPages = require('./routes/admin_pages.js');
const adminCategories = require('./routes/admin_categories.js');
const adminProducts = require('./routes/admin_products.js');
const products = require('./routes/products.js');
const user = require('./routes/user');
const cart = require('./routes/cart.js');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const fileUpload = require('express-fileupload');
const {Page} = require('./models/pages');
const {Category} = require('./models/category');
const passport = require('passport');
const knox = require('knox');


//connect to db
if(process.env.db)
mongoose.connect(process.env.db);
else
mongoose.connect(config.database);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB');
});

//init app
const app = express();

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//set public folder
app.use(express.static(path.join(__dirname, 'public')));

//set global error variables
app.locals.errors = null;

//Get all pages to pass header.ejs
Page.find({}).sort({sorting:1}).exec(function(err, pages){
    app.locals.pages = pages;
});

//Get all categories to pass header.ejs
Category.find(function(err, categories){
    app.locals.categories = categories;
});

//Express fileUplaod middleware
app.use(fileUpload());


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
  //cookie: { secure: true }
}));


//Express messages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//Passport Config
require('./config/passport')(passport)

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*',function(req,res,next){
    res.locals.cart = req.session.cart;
    res.locals.user = req.user || null;
    next();
})


//Set Routes
app.use('/products', products);
app.use('/cart', cart);
app.use('/user', user);
app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/', pages);

//Start the server
const port = process.env.PORT || 3000; 
app.listen(port, () => {
  console.log('Sever started on port ' + port);
})