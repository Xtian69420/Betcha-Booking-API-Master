const BookingsModel = require('../collection/Bookings');
const UnitModel = require('../collection/Unit');
const CounterModel = require('../collection/Counter'); 
const PaymentModel = require('../collection/Payment');
const mongoose = require('mongoose');

const generateDateRange = (checkIn, checkOut) => {
    let start = new Date(checkIn);
    let end = new Date(checkOut);
    let dates = [];
    while (start <= end) {
        dates.push(start.toISOString().split('T')[0]); 
        start.setDate(start.getDate() + 1);
    }
    return dates;
};

const generateReference = async () => {
    const counter = await CounterModel.findOneAndUpdate(
        { collectionName: 'bookings' }, 
        { $inc: { sequenceValue: 1 } }, 
        { new: true, upsert: true } 
    );

    const sequenceValue = counter.sequenceValue;
    return `REF${sequenceValue.toString().padStart(6, '0')}`;
};

exports.Book = async (req, res) => {
    try {
        const { CheckIn, CheckOut, UserId, UnitId, AdditionalPax } = req.body;

        // Convert CheckIn and CheckOut to ISODate if they are strings
        const convertToISODate = (date) => {
            if (typeof date === "string") {
                const normalizedDate = new Date(date);
                return normalizedDate instanceof Date && !isNaN(normalizedDate) ? normalizedDate : null;
            }
            return date;
        };

        const isoCheckIn = convertToISODate(CheckIn);
        const isoCheckOut = convertToISODate(CheckOut);

        if (!isoCheckIn || !isoCheckOut) {
            return res.status(400).json({ message: "Invalid CheckIn or CheckOut date format" });
        }

        const BookDates = generateDateRange(isoCheckIn, isoCheckOut);

        const unit = await UnitModel.findById(UnitId);
        if (!unit) {
            return res.status(404).json({ message: "Unit not found" });
        }

        const existingBookings = await BookingsModel.find({
            UnitId,
            'BookDates.Date': { $in: BookDates }
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({ message: "Unit is already booked for selected dates" });
        }

        const daysBooked = BookDates.length;
        const pricePerDay = unit.unitPrice;
        const pricePerPax = unit.pricePerPax;
        const reservationFee = unit.reservation;

        const totalAmount = (pricePerDay * daysBooked) + (pricePerPax * AdditionalPax) + reservationFee;

        const Reference = await generateReference();

        const newBooking = new BookingsModel({
            Reference,
            Date: new Date().toISOString().split('T')[0],
            CheckIn: isoCheckIn,
            CheckOut: isoCheckOut,
            UserId,
            UnitId,
            BookDates: BookDates.map(date => ({ Date: date })),
            NumOfDays: daysBooked,
            AdditionalPax,
            Total: totalAmount,
            isSuccess: true,
            Status: 'Unpaid'
        });

        await newBooking.save();
        res.status(201).json({ message: 'Booking successfully created', booking: newBooking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating booking', error });
    }
};

exports.EditDate = async (req, res) => {
    try {
        const { reference, CheckIn, CheckOut } = req.body;

        // Convert CheckIn and CheckOut to ISODate if they are strings
        const convertToISODate = (date) => {
            if (typeof date === "string") {
                const normalizedDate = new Date(date);
                return normalizedDate instanceof Date && !isNaN(normalizedDate) ? normalizedDate : null;
            }
            return date;
        };

        const isoCheckIn = convertToISODate(CheckIn);
        const isoCheckOut = convertToISODate(CheckOut);

        if (!isoCheckIn || !isoCheckOut) {
            return res.status(400).json({ message: "Invalid CheckIn or CheckOut date format" });
        }

        const BookDates = generateDateRange(isoCheckIn, isoCheckOut);

        const booking = await BookingsModel.findOne({ Reference: reference });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const existingBookings = await BookingsModel.find({
            UnitId: booking.UnitId,
            'BookDates.Date': { $in: BookDates }
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({ message: "Unit is already booked for selected dates" });
        }

        booking.CheckIn = isoCheckIn;
        booking.CheckOut = isoCheckOut;
        booking.BookDates = BookDates.map(date => ({ Date: date }));

        await booking.save();
        res.status(200).json({ message: 'Booking dates successfully updated', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating booking dates', error });
    }
};


exports.EditStatus = async (req, res) => {
    try {
        const { reference, Status } = req.body;

        const booking = await BookingsModel.findOne({ Reference: reference });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        const now = new Date();
        const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        booking.EditStatusDates.push({
            Date: formattedDateTime,
            Update: Status
        });

        booking.Status = Status;

        if (["Cancelled", "Did not arrive", "Unpaid"].includes(Status)) {
            booking.BookDates = [];
        }
        await booking.save();

        res.status(200).json({ message: 'Booking status successfully updated', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating booking status', error });
    }
};

exports.addNumDays = async (req,res)=>{
    try {
        const { reference, numdays } = req.body;

        const booking = await BookingsModel.findOne({ Reference: reference });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        const now = new Date();
        const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        booking.EditStatusDates.push({
            Date: formattedDateTime,
            Update: numdays
        });

        booking.NumOfDays = numdays;
        await booking.save();

        res.status(200).json({ message: 'Booking numdays successfully updated', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating booking numdays', error });
    }
};

exports.getBookingUnit = async (req, res) => {
    try {
        const { unitId } = req.params;

        const bookings = await BookingsModel.find({ UnitId: unitId }).populate('PaymentId').populate('UnitId').populate('UserId');
        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving bookings', error });
    }
};

exports.getBookingUnitDates = async (req, res) => {
    try {
        let { unitId } = req.params;

        if (unitId === 'null' || !mongoose.Types.ObjectId.isValid(unitId)) {
            return res.status(400).json({ message: 'Invalid unitId' });
        }

        const bookings = await BookingsModel.find(
            { 
                UnitId: unitId,
                Status: { $nin: ['Cancelled', 'Unpaid', 'Did not arrive'] } 
            },
            { BookDates: 1, _id: 0 }
        );

        const dates = bookings.flatMap(booking => booking.BookDates.map(dateObj => dateObj.Date));

        res.status(200).json({ message: "", dates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving booking dates', error });
    }
};



exports.getOneBooking = async (req, res) => {
    try {
        const { reference } = req.params;

        const booking = await BookingsModel.findOne({ Reference: reference }).populate('PaymentId').populate('UnitId').populate('UserId');
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving booking', error });
    }
};

exports.getAllBooking = async (req, res) => {
    try {

        const bookings = await BookingsModel.find().populate('PaymentId').populate('UnitId').populate('UserId');
        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving bookings', error });
    }
};

exports.getBookingUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const bookings = await BookingsModel.find({ UserId: userId }).populate('PaymentId').populate('UnitId').populate('UserId');
        
        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for this user" });
        }

        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving bookings for the user', error });
    }
};


exports.deleteBooking = async (req, res) => {
    try {
        const { reference } = req.params;
        
        const booking = await BookingsModel.findOneAndDelete({ Reference: reference });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json({ message: 'Booking successfully deleted', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting booking', error });
    }
};

exports.getAllDatesBookByUnit = async (req, res) => {
    try {
        const { unitId } = req.params; 
        
        const bookings = await BookingsModel.find({
            UnitId: unitId,
            Status: { $ne: 'Cancelled' }
        }).populate('PaymentId').populate('UnitId').populate('UserId');

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No valid bookings found for this unit" });
        }

        const allBookedDates = [];
        bookings.forEach(booking => {
            booking.BookDates.forEach(dateEntry => {
                allBookedDates.push(dateEntry.Date);
            });
        });

        allBookedDates.sort((a, b) => new Date(a) - new Date(b));

        res.status(200).json({ message: "Booked dates retrieved successfully", bookedDates: allBookedDates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching booked dates", error });
    }
};


exports.getAllNotSuccessful = async (req, res) => {
    try {
        const bookings = await BookingsModel.find({ Status: { $nin: ['Successful', 'Cancelled', 'Unpaid', 'Did not arrive', 'Did not pay'] } }).populate('PaymentId').populate('UnitId').populate('UserId');
        
        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No bookings with a status other than 'Successful' found" });
        }

        res.status(200).json({ message: "Bookings retrieved successfully", bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving bookings", error });
    }
};

exports.getAllSuccessful = async (req, res) => {
    try {
        const bookings = await BookingsModel.find({
            Status: { $in: ['Successful', 'Cancelled', 'Unpaid', 'Did not arrive'] }
        }).populate('PaymentId').populate('UnitId').populate('UserId');        
        
        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No bookings with the status 'Successful' found" });
        }

        res.status(200).json({ message: "Successful bookings retrieved successfully", bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving successful bookings", error });
    }
};

exports.getAllSuccessfulAndCancelled = async (req, res) => {
    try {
        const bookings = await BookingsModel.find({ Status: { $in: ['Successful', 'Cancelled', 'Did not arrive', 'Unpaid'] } })
            .populate('PaymentId')
            .populate('UnitId')
            .populate('UserId');
        
        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No bookings with the status 'Successful' or 'Cancelled' found" });
        }

        res.status(200).json({ message: "Successful and Cancelled bookings retrieved successfully", bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving successful and cancelled bookings", error });
    }
};

exports.getBookingByDate = async (req, res) => {
    try {
        const { date } = req.params; 

        if (!date) {
            return res.status(400).json({ message: "Date parameter is required." });
        }

        const formattedDate = new Date(date);
        if (isNaN(formattedDate)) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        const matchingBookings = await BookingsModel.find({
            'BookDates.Date': date
        }).populate('PaymentId').populate('UnitId').populate('UserId');

        if (matchingBookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for the specified date." });
        }

        res.status(200).json({
            message: "Bookings retrieved successfully",
            bookings: matchingBookings
        });
    } catch (error) {
        console.error("Error retrieving bookings by date:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

exports.getBookingByDateAndUnit = async (req, res) => {
    try {
        const { date, unitId } = req.params;  

        if (!date || !unitId) {
            return res.status(400).json({ message: "Date and UnitId parameters are required." });
        }

        const formattedDate = new Date(date);
        if (isNaN(formattedDate)) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        const matchingBookings = await BookingsModel.find({
            'BookDates.Date': date,
            UnitId: unitId
        }).populate('PaymentId').populate('UnitId').populate('UserId');

        if (matchingBookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for the specified date and unit." });
        }

        res.status(200).json({
            message: "Bookings retrieved successfully for the specified date and unit",
            bookings: matchingBookings
        });
    } catch (error) {
        console.error("Error retrieving bookings by date and unit:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

exports.editSuccess = async (req, res) => {
    try {
        const { reference, isSuccess } = req.body;
        const booking = await BookingsModel.findOne({ Reference: reference });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        booking.isSuccess = isSuccess;

        await booking.save();

        res.status(200).json({
            message: 'Booking success status updated successfully',
            ref: reference,
            isSuccess: booking.isSuccess
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating success status', error });
    }
};


exports.getAllDatesForAllUnits = async (req, res) => {
    try {
        const bookings = await BookingsModel.find({
            Status: { $ne: 'Cancelled'}
        }).populate('PaymentId').populate('UnitId').populate('UserId');

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No valid bookings found" });
        }

        const allBookedDates = [];

        bookings.forEach(booking => {
            booking.BookDates.forEach(dateEntry => {
                allBookedDates.push(dateEntry.Date);
            });
        });
        allBookedDates.sort((a, b) => new Date(a) - new Date(b));

        res.status(200).json({ message: "All booked dates retrieved successfully", bookedDates: allBookedDates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching booked dates", error });
    }
};

const moment = require('moment-timezone');

const getCurrentMonth = () => {
    const now = moment().tz('Asia/Manila');
    return `${now.year()}-${String(now.month() + 1).padStart(2, '0')}`;
};

const getCurrentYear = () => {
    const now = moment().tz('Asia/Manila');
    return `${now.year()}`;
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

exports.getThisMonthEarnings = async (req, res) => {
    try {
        const currentMonth = getCurrentMonth();
        const startOfMonth = moment.tz(`${currentMonth}-01`, 'Asia/Manila').startOf('month').toDate();
        const endOfMonth = moment.tz(`${currentMonth}-01`, 'Asia/Manila').endOf('month').toDate();

        const earnings = await BookingsModel.aggregate([
            {
                $match: {
                    $or: [
                        { CheckIn: { $gte: startOfMonth, $lt: endOfMonth } },
                        { CheckOut: { $gte: startOfMonth, $lt: endOfMonth } }
                    ],
                    Status: { $in: ['Successful', 'Fully-Paid', 'Reserved', 'Arrived', 'Pending'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$Total' }
                }
            }
        ]);

        const totalEarnings = earnings.length > 0 ? earnings[0].totalEarnings : 0.00;
        const formattedEarnings = formatCurrency(totalEarnings);

        res.status(200).json({
            message: "Monthly earnings retrieved successfully",
            earnings: formattedEarnings,
            period: "this month"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving monthly earnings', error });
    }
};

exports.getThisYearEarnings = async (req, res) => {
    try {
        const currentYear = getCurrentYear();
        const startOfYear = moment.tz(`${currentYear}-01-01`, 'Asia/Manila').startOf('year').toDate();
        const endOfYear = moment.tz(`${currentYear}-12-31`, 'Asia/Manila').endOf('year').toDate();

        const earnings = await BookingsModel.aggregate([
            {
                $match: {
                    $or: [
                        { CheckIn: { $gte: startOfYear, $lte: endOfYear } },
                        { CheckOut: { $gte: startOfYear, $lte: endOfYear } }
                    ],
                    Status: { $in: ['Successful', 'Fully-Paid', 'Reserved'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$Total' }
                }
            }
        ]);

        const totalEarnings = earnings.length > 0 ? earnings[0].totalEarnings : 0.00;
        const formattedEarnings = formatCurrency(totalEarnings);

        res.status(200).json({
            message: "Yearly earnings retrieved successfully",
            earnings: formattedEarnings,
            period: "this year"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving yearly earnings', error });
    }
};

