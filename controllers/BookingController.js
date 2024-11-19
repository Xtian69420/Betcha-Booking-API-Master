const BookingsModel = require('../collection/Bookings');

exports.Book = async (req, res)=>{
    // post booking
    // i want to see the bookings first if the dates are not available
    // the two dates check in and check out is populated range for example {check in: 2025-01-01, check out: 2025-01-05} the date will store the (2025-01-01, 2025-01-02, 2025-01-03, 2025-01-04, 2025-01-05)}
};

exports.EditDate = async (req, res)=>{
    // edit Date booking
    // the two dates check in and check out is populated range for example {check in: 2025-01-01, check out: 2025-01-05} the date will store the (2025-01-01, 2025-01-02, 2025-01-03, 2025-01-04, 2025-01-05)}
};

exports.EditStatus = async (req, res)=>{
    // edit Status of Booking using reference number
};

exports.getBookingUnit = async (req, res)=>{
    // get all bookings of specific unit using uniId
};

exports.getOneBooking = async (req, res)=>{
    // get one booking using reference number
};

exports.getAllBooking = async (req, res)=>{
    // get all bookings in general
};

exports.deleteBooking = async (req, res)=>{
    // delete booking using booking reference number
};