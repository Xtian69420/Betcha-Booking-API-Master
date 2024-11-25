const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db'); 
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const userController = require('./controllers/userController');
const unitController = require('./controllers/unitController');
const adminController = require('./controllers/adminController');
const superAdminController = require('./controllers/superAdminController');
const notificationController = require('./controllers/notificationController');
const bookingController = require('./controllers/BookingController');
const paymentController = require('./controllers/paymentController');
const auditController = require('./controllers/auditController');
const otpController = require('./controllers/otpController');
const topUnitController = require('./controllers/topUnitsController');
const faqsController = require('./controllers/FAQsController');

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

app.get('/', (req, res) => {
  res.status(200).send('Server is alive!');
});

// User_Routes
app.post('/Register', userController.registerUser);
app.post('/Login', userController.loginUser);
app.get('/getUserIdImage/:userId', userController.getUserIdImage);
app.get('/user/:userId', userController.getUserById);
app.put('/updateUser/:userId', userController.updateUser);
app.delete('/deleteUser/:userId', userController.deleteUser);

// ID_Confirmation_Routes
  app.get('/users/unverified', userController.getUnverifiedUsers);
// same as app.put('/updateUser/:userId', userController.updateUser);

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
app.delete('/deleteUnit/:id', unitController.deleteUnit);
app.get('/units', unitController.getAllUnits);
app.get('/units/displayDashboard', unitController.getAvailableUnits);
app.get('/getUnitById/:id', unitController.getUnitById);
app.put('/editUnit/:id', unitController.editUnit);

// display ranks
app.get('/units/top', unitController.getTopUnits);
app.get('/units/bottom', unitController.getBottomUnits);

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
app.get('/bookings/unit/:unitId/dates', bookingController.getAllDatesBookByUnit);
app.get('/booking/user/:userID', bookingController.getBookingUser);
app.get('/bookings/pending', bookingController.getAllNotSuccessful);
app.get('/bookings/successful', bookingController.getAllSuccessful);
app.get('/getBookingByDate/:date', bookingController.getBookingByDate);
app.get('/getBookingByDateandUnit/:date/:unitId', bookingController.getBookingByDateAndUnit);
app.delete('/booking/:reference', bookingController.deleteBooking);

// Notification_Routes
app.post ('/notif', notificationController.CreateNotif);
app.get ('/allNottif/', notificationController.getAllNotif);
app.get ('/AllNotifInUser/:userId', notificationController.getAllNotifUser);
app.get ('/AllNotifInAdmin/:adminId', notificationController.getAllNotifAdmin);
app.get ('/AllNotifInSuper/:superAdminId', notificationController.getAllNotifSuper);
app.get ('/Notif/:notifid', notificationController.getSpecificNtoif);
app.delete ('/notif/:notifId', notificationController.deleteNotif)

// Payment_Routes
app.post('/payment/reservation', paymentController.PaymentReservation);
app.post('/payment/full', paymentController.FullPayment);
app.get('/payments', paymentController.getAllPayments);
app.get('/getPaymentDetails/:linkId', paymentController.getPaymentDetails);
app.get('/payments/user/:userId', paymentController.getAllPaymentsByUser);
app.get('/payments/unit/:unitId', paymentController.getAllPaymentsByUnit);

// Audit_Routes
app.post('/audit/create', auditController.createAudit);
app.get('/auit/all', auditController.getAuditAllUsers);
app.get('/audit/admin', auditController.getAuditForAdmin);
app.get('/audit/customer', auditController.getAuditForCustomer);

// TopUnit_Routes
app.get('/getMonth/:month/:year', topUnitController.getMonth);
app.get('/getAnnual/:year', topUnitController.getAnnual);
app.get('/getAllDates', topUnitController.getAllDates);
app.put('/updateTopUnits', topUnitController.updateTopForUnits);

// OTP_Routes
app.post('/otp/create', otpController.createOtp);
app.post('/otp/verify', otpController.verifyOtp);
app.post('/otp/delete', otpController.deleteOtp);
app.post('/otp/resend', otpController.resendOtp);

// FAQs_Routes
app.post('/faqs/create', faqsController.CreateFaqs);
app.get('faqs/getAll', faqsController.GetAllFaqs);
app.get('faqs/get/:id', faqsController.GetSpecificFaqs);
app.put('faqs/update/:id', faqsController.UpdateFaqs);