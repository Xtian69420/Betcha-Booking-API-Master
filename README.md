# 🚀 **Betcha-Booking API-MASTER**

---
#### Welcome to the **Server-end-Betcha-Booking-wep-app**! This project is part of the Betcha Booking system, providing a dynamic data structures and controllers to interact with the Clien-end.
Website URL: [Betcha Booking Web-app](https://betcha-booking.netlify.app)
---

| **Packages**          | **Version** | **Description**                                                                 |
|-----------------------|-------------|---------------------------------------------------------------------------------|
| `@sendgrid/mail`      | `^8.1.4`    | SendGrid API for sending transactional emails                                  |
| `bcryptjs`            | `^2.4.3`    | JavaScript-based password hashing library                                     |
| `body-parser`         | `^1.20.3`   | Middleware for parsing incoming request bodies in JSON or URL-encoded formats |
| `cors`                | `^2.8.5`    | Middleware for enabling Cross-Origin Resource Sharing                         |
| `crypto-js`           | `^4.2.0`    | Library for standard cryptographic algorithms                                 |
| `dotenv`              | `^16.4.5`   | Module for loading environment variables from a `.env` file                   |
| `google-auth-library` | `^9.14.2`   | Google authentication library for Node.js                                    |
| `googleapis`          | `^144.0.0`  | Google API client library                                                     |
| `jsonwebtoken`        | `^9.0.2`    | Library for generating and verifying JSON Web Tokens                          |
| `mongodb`             | `^6.10.0`   | MongoDB Node.js driver                                                        |
| `mongoose`            | `^8.8.0`    | ODM library for MongoDB, managing schemas and models                          |
| `multer`              | `^1.4.5-lts.1` | Middleware for handling `multipart/form-data` file uploads                   |
| `node-cron`           | `^3.0.3`    | Library 
|
| `streamifier`         | `^0.1.1`    | Converts a buffer or string to a readable stream                              |

---

## 📋 **How to Use**

### 1️⃣ **Setup**

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/Xtian69420/Betcha-Booking-API-Master.git
2. cd <project_directory>
3. npm install
------------------------------
### 2️⃣ **Usage Instructions**

# Betcha-Booking-API Documentation

Base URL: [Betcha Booking API](https://betcha-booking-api-master.onrender.com)

This documentation provides a detailed guide to all the available routes and request bodies in the Betcha Booking API. Please check Postman or Insomnia for actual response values for each route.

---

## User Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /Register` | Register a new user | `{ "email": "example@mail.com", "password": "password123", "phoneNumber": "123456789", "firstName": "John", "middleInitial": "D", "lastName": "Doe", "IdImage": "<image>" }` |
| `POST /Login` | Login as a customer | `{ "email": "example@mail.com", "password": "password123" }` |
| `GET /getUserIdImage/:userId` | Get customer ID image | N/A |
| `GET /user/:userId` | Get customer information | N/A |
| `PUT /updateUser/:userId` | Update customer information | `{ "email": "example@mail.com", "password": "newpassword", "phoneNumber": "987654321", "firstName": "John", "middleInitial": "D", "lastName": "Doe" }` |
| `DELETE /deleteUser/:userId` | Delete a customer | N/A |

---

## ID Verification Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `GET /users/unverified` | Get all unverified users | N/A |
| `PUT /updateUser/:userId` | Update user verification status | `{ "isVerified": true }` or `{ "isVerified": false }` |

---

## User Profile Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /profile-image/:userId` | Upload user profile image | `{ "profileImage": "<image>" }` |
| `GET /profile-image/:userId` | Get user profile picture | N/A |
| `PUT /profile-image/:userId` | Update user profile picture | `{ "profileImage": "<image>" }` |
| `DELETE /profile-image/:userId` | Delete user profile image | N/A |

---

## Admin Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /createAdmin` | Create a new admin | `{ "email": "admin@mail.com", "password": "admin123", "adminName": "Admin Name" }` |
| `POST /LoginAdmin` | Login as an admin | `{ "email": "admin@mail.com", "password": "admin123" }` |
| `DELETE /deleteAdmin/:adminId` | Delete an admin | N/A |
| `PUT /updateAdmin/:adminId` | Update admin information | `{ "email": "admin@mail.com", "password": "newpassword", "adminName": "Updated Admin" }` |
| `GET /getAdminInfo/:adminId` | Get admin info | N/A |
| `GET /getAllAdmins` | Get all admins | N/A |

---

## Unit Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /addUnit` | Add a new unit | `{ "unitName": "Unit 1", "location": "Location", "maplink": "link", "description": "Unit description", "amenities": {"towel": true, "wifi": true}, "otherAmenities": "Additional features", "unitPrice": 100, "isAvailable": true, "maxPax": 4, "pricePerPax": 25, "category": "Apartment" }` |
| `DELETE /deleteUnit` | Delete a unit | N/A |
| `GET /units` | Get all units | N/A |
| `GET /getUnitById/:id` | Get a specific unit | N/A |
| `GET /units/displayDashboard` | Get all available units | N/A |
| `GET /units/top` | Get top 5 ranking units | N/A |
| `GET /units/bottom` | Get lowest 5 ranked units | N/A |
| `PUT /editUnit/:id` | Update unit information | `{ "unitName": "Updated Unit", "location": "Updated Location", "maplink": "newlink", "description": "Updated description", "amenities": {"towel": true}, "unitPrice": 150, "isAvailable": true, "maxPax": 5, "pricePerPax": 30, "category": "Studio" }` |

---

## Super Admin Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /superAdminRegister` | Register a superadmin | `{ "email": "superadmin@mail.com", "password": "password", "superAdminName": "Super Admin" }` |
| `POST /superAdminLogin` | Login as a superadmin | `{ "email": "superadmin@mail.com", "password": "password" }` |
| `PUT /superAdminEdit/:superAdminId` | Edit superadmin info | `{ "email": "superadmin@mail.com", "password": "newpassword", "superAdminName": "Updated Super Admin" }` |
| `DELETE /superAdminDelete/:superAdminId` | Delete a superadmin | N/A |
| `GET /getAllSuperAdmin` | Get all superadmins | N/A |
| `GET /getSuperAdmin/:superAdmin` | Get superadmin info | N/A |

---

## Booking Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /book` | Create a booking | `{ "CheckIn": "2024-12-01", "CheckOut": "2024-12-07", "UserId": "user123", "UnitId": "unit456", "AdditionalPax": 2 }` |
| `PUT /edit-date` | Reschedule a booking | `{ "reference": "bookingRef", "CheckIn": "2024-12-05", "CheckOut": "2024-12-10" }` |
| `PUT /edit-status` | Edit booking status | `{ "reference": "bookingRef", "status": "confirmed" }` |
| `GET /bookings/unit/:unitId` | Get all bookings for a specific unit | N/A |
| `GET /booking/:reference` | Get specific booking | N/A |
| `GET /bookings` | Get all bookings | N/A |
| `GET /bookings/unit/:unitId/dates` | Get all booking dates for a unit | N/A |
| `GET /booking/user/:userID` | Get all bookings for a user | N/A |
| `DELETE /booking/:reference` | Delete a booking | N/A |

---

## Notification Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /notif` | Add a new notification | `{ "fromId": "user123", "toId": "admin456", "message": "New booking confirmed", "isViewed": false }` |
| `GET /allNottif/` | Get all notifications | N/A |
| `GET /AllNotifInUser/:userId` | Get all notifications for a user | N/A |
| `GET /AllNotifInAdmin/:adminId` | Get all notifications for an admin | N/A |
| `GET /AllNotifInSuper/:superAdminId` | Get all notifications for a superadmin | N/A |
| `GET /Notif/:notifid` | View specific notification | N/A |
| `DELETE /notif/:notifId` | Delete a notification | N/A |

---

## Payment Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /payment/reservation` | Create a reservation payment | `{ "ref": "bookingRef", "amount": 250, "userId": "user123", "unitId": "unit456" }` |
| `POST /payment/full` | Create a full payment | `{ "ref": "bookingRef", "amount": 500, "userId": "user123", "unitId": "unit456" }` |
| `GET /payments` | Get all payments | N/A |
| `GET /getPaymentDetails/:linkId` | Get payment details | N/A |
| `GET /payments/user/:userId` | Get payments by user | N/A |
| `GET /payments/unit/:unitId` | Get payments by unit | N/A |

---

## Audit Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /audit/create` | Create an audit entry | `{ "UserId": "user123", "Activity": "Booking created", "Role": "customer" }` |
| `GET /auit/all` | Get all audits | N/A |
| `GET /audit/admin` | Get audits for admins | N/A |
| `GET /audit/customer` | Get audits for customers | N/A |

---

## OTP Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `POST /otp/create` | Create OTP for registration | `{ "email": "user@mail.com" }` |
| `POST /otp/verify` | Verify OTP | `{ "email": "user@mail.com", "otp": "123456" }` |
| `POST /otp/delete` | Delete OTP | `{ "email": "user@mail.com" }` |
| `POST /otp/resend` | Resend OTP | `{ "email": "user@mail.com" }` |

---

## Top Unit Routes

| Route | Description | Request Body |
|-------|-------------|--------------|
| `GET /getMonth/:month/:year` | Get top units for the month | N/A |
| `GET /getAnnual/:year` | Get top units for the year | N/A |
| `GET /getAllDates` | Get all available dates | N/A |

---
