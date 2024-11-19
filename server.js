const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db'); 
const path = require('path');
require('dotenv').config();

const userController = require('./controllers/userController');
const unitController = require('./controllers/unitController');
const adminController = require('./controllers/adminController');
const superAdminController = require('./controllers/superAdminController');
const notificationController = require('./controllers/notificationController');
const bookingController = require('./controllers/bookingController');

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

// Get_Unverified_Users_ROute
app.get('/users/unverified', userController.getUnverifiedUsers);

// User_Profile_Routes
app.post('/profile-image/:userId', userController.uploadProfileImage); 
app.get('/profile-image/:userId', userController.getProfileImage);   
app.put('/profile-image/:userId', userController.updateProfileImage); 
app.delete('/profile-image/:userId', userController.deleteProfileImage);

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
app.get('/getUnitById/:id', unitController.getUnitById);
app.put('/editUnit/:id', unitController.editUnit);

// Super_Admin_Routes
app.post('/superAdminRegister', superAdminController.createSuperAdmin);
app.post('/superAdminLogin', superAdminController.loginSuperAdmin);
app.put('/superAdminEdit/:superAdminId', superAdminController.updateSuperAdmin);
app.delete('/superAdminDelete/:superAdminId', superAdminController.deleteSuperAdmin);
app.get('/getAllSuperAdmin', superAdminController.getAllSuperAdmin);
app.get('/getSuperAdmin/:superAdmin', superAdminController.getSuperAdminInfo);

// Bookings_Routes
app.post('/book', bookingController.Book);
app.put('/edit-date', bookingController.EditDate);
app.put('/edit-status', bookingController.EditStatus);
app.get('/bookings/unit/:unitId', bookingController.getBookingUnit);
app.get('/booking/:reference', bookingController.getOneBooking);
app.get('/bookings', bookingController.getAllBooking);
app.delete('/booking/:reference', bookingController.deleteBooking);
app.get('/bookings/unit/:unitId/dates', bookingController.getAllDatesBookByUnit);

// TopUnit_Routes
    // get (/getAnualTopUnits)
    // get (/getMonthlyEarnings(Weeks)) from today to last 4 weeks
    // get (/getAnualEarnings(Months)) from today to last 12 months

// Notification_Routes
    app.post ('/notif', notificationController.CreateNotif);
    app.get ('/allNottif/', notificationController.getAllNotif);
    app.get ('/AllNotifInUser/:userId', notificationController.getAllNotifUser);
    app.get ('/AllNotifInAdmin/:adminId', notificationController.getAllNotifAdmin);
    app.get ('/AllNotifInSuper/:superAdminId', notificationController.getAllNotifSuper);
    app.get ('/Notif/:notifid', notificationController.getSpecificNtoif);
    app.delete ('/notif/:notifId', notificationController.deleteNotif)

// ID_Confirmation_Routes
    // same as app.get('/user/:userId', userController.getUserById);
    // same as app.put('/updateUser/:userId', userController.updateUser);