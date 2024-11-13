const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db'); 
const path = require('path');
require('dotenv').config();

const userController = require('./controllers/userController');
const unitController = require('./controllers/unitController');
const adminController = require('./controllers/adminController');
const superAdminController = require('./controllers/superAdminController');

const app = express();
app.use(bodyParser.json());

const cors = require('cors');

const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setTimeout(60000, () => { 
    res.status(408).send('Request Timeout');
  });
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running`);
});

// loading before loading any page (HTML) to make sure that the user won't make any transaction before the server starts 
app.get('/ping', (req, res) => {
  res.status(200).send('Server is alive!');
});

// User_Routes
app.post('/Register', userController.registerUser);
app.post('/Login', userController.loginUser);
app.get('/getUserIdImage/:userId', userController.getUserIdImage);
app.get('/user/:userId', userController.getUserById);
app.put('/updateUser/:userId', userController.updateUser);
app.delete('/deleteUser/:userId', userController.deleteUser);

// Admin_Routes
app.post('/createAdmin', adminController.createAdmin);
app.post('/LoginAdmin', adminController.loginAdmin);
app.delete('/deleteAdmin/:adminId', adminController.deleteAdmin);
app.put('/updateAdmin/:adminId', adminController.updateAdmin);
app.get('/getAdminInfo/:adminId', adminController.getAdminInfo);
app.get('/getAllAdmins', adminController.getAllAdmin);


// Unit_Routes
app.post('/addUnit', unitController.addUnit);
app.delete('/deleteUnit', unitController.deleteUnit);
app.get('/units', unitController.getAllUnits);
app.get('/getUnitById/:id', unitController.getAllUnits);
app.put('/editUnit/:id', unitController.editUnit);


// Super_Admin_Routes
app.post('/superAdminRegister', superAdminController.createSuperAdmin);
app.post('/superAdminLogin', superAdminController.loginSuperAdmin);
app.put('/superAdminEdit/:superAdminId', superAdminController.updateSuperAdmin); 
app.delete('/superAdminDelete/:superAdminId', superAdminController.deleteSuperAdmin);
app.get('/getAllSuperAdmin', superAdminController.getAllSuperAdmin);


// Bookings_Routes
    // post (/createBooking)
    // put (/editBooking)
    // get (/getAllBookStatusSuccess)
    // get (/getAllBookStatusPending)
    // get (/getAllBookings/:userId)

// TopUnit_Routes
    // get (/getAnualTopUnits)
    // get (/getMonthlyEarnings(Weeks)) from today to last 4 weeks
    // get (/getAnualEarnings(Months)) from today to last 12 months

// Notification_Routes
    // post (/notif)
    // get (/allNotif/:userid)
    // get (/allNottif/)
    // delete (/notif/:notifId)

// ID_Confirmation_Routes
    // same as app.get('/user/:userId', userController.getUserById);
    // same as app.put('/updateUser/:userId', userController.updateUser);
    //