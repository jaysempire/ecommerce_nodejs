const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const { default: MongoStore } = require('connect-mongo');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression')
const morgan = require('morgan')

//const accessLogStream = require('./util/file').accesslog

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.cz4rs4n.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?appName=Cluster0`;

const app = express();

// 1. SETTINGS
app.set('view engine', 'ejs');
app.set('views', 'views');

/* const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert'); */

const User = require('./models/user');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');
const { Stream } = require('nodemailer/lib/xoauth2');
const { readFileSync } = require('fs');

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream} ))

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' ) {
        cb(null, true)
    }
    else{
        cb(null, false)
    }
}

// 2. STATIC FILES & PARSING
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// 3. SESSION CONFIG (Must be before CSRF and Routes)
app.use(
    session({
        secret: 'My hiddden hard drives',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        store: MongoStore.create({
            mongoUrl: MONGODB_URI,
            collectionName: 'sessions',
            ttl: 60 * 30
        }),
    cookie: {
      maxAge: 1000 * 60 * 30 // 30 minutes
    }
    })
);

app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('img'))

// 4. SECURITY & FLASH (Must be after Session)
const csrfProtection = csrf();
app.use(csrfProtection);
app.use(flash());

// 5. GLOBAL VIEW VARIABLES
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});


// 6. THE "USER LOCATOR" MIDDLEWARE
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user; 
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

// 7. ROUTES
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// 8.  ERROR HANDLING
app.use('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
    console.log(error);
    
    //res.redirect('/500');
    res.status(500).render('500', {
        pageTitle: '500 | Error', 
        path:'/500', 
        isAuthenticated: req.session,
    });
})

// 9. DATABASE CONNECTION
mongoose.connect(MONGODB_URI)
    .then(result => {
        console.log('Connected to MongoDB and Listening on Port 3000');
       /*  https
            .createServer({key: privateKey, cert: certificate}, app)
            .listen(process.env.PORT || 3000); */
            app.listen(process.env.PORT || 3000);
    })
    .catch(err => console.log(err));