if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const app = express();
const dotenv = require('dotenv')
const morgan = require('morgan')
const bodyparser = require('body-parser');
const session = require('express-session');

const connectDB = require('./server/database/connection')

const admin_router = require('./server/routes/admin/admin_routes');
const trainers_router = require('./server/routes/trainers/trainers_routes');
const clients_router = require('./server/routes/clients/clients_routes');
const payment_router = require('./server/routes/payment_routes/payment_routes');

const PORT = process.env.PORT || 8080;

connectDB();

// ✅ Require cron after DB connection
require('./cron');   // <-- this will load cron jobs

app.use(express.json());
// parse request to body-parser
app.use(bodyparser.urlencoded({extended:true}))

const cacheTime = 60;
app.use((req, res, next) => {
    res.setHeader("Cache-Control", `public,no-store, must-revalidate, max-age=${cacheTime}`);
    res.setHeader("Pragma", "no-cache");  
    next()
})


// log requests
app.use(morgan('tiny'));

// set view engine
app.set('view engine', 'ejs');
// app.set('views')

app.use(express.static('assets'));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 300000 }
}));

app.use('/',admin_router );
app.use('/',trainers_router);
app.use('/',clients_router);
app.use("/", payment_router);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});