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
            Status: 'Pending Payment'
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

        if (["Cancelled", "Did not arrived", "Unpaid"].includes(Status)) {
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

        const bookings = await BookingsModel.find({ userId: userId }).populate('PaymentId').populate('UnitId').populate('UserId');
        
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
        const bookings = await BookingsModel.find({ Status: { $nin: ['Successful', 'Cancelled', 'Unpaid', 'Did not arrived'] } }).populate('PaymentId').populate('UnitId').populate('UserId');
        
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
        const bookings = await BookingsModel.find({ Status: 'Successful' }).populate('PaymentId').populate('UnitId').populate('UserId');;
        
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
        const bookings = await BookingsModel.find({ Status: { $in: ['Successful', 'Cancelled', 'Did not arrived', 'Unpaid'] } })
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
            Status: { $ne: 'Cancelled' }
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

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentYear = () => {
    const now = new Date();
    return `${now.getFullYear()}`;
};


exports.getThisMonthEarnings = async (req, res) => {
    try {
        const currentMonth = getCurrentMonth(); // Get current month
        
        // Determine the start and end of the current month
        const startOfMonth = new Date(`${currentMonth}-01`);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Set to the next month

        // Log start and end of month for debugging
        console.log('Start of Month:', startOfMonth);
        console.log('End of Month:', endOfMonth);

        const earnings = await BookingsModel.aggregate([
            {
                $match: {
                    $or: [
                        { CheckIn: { $gte: startOfMonth, $lt: endOfMonth } },
                        { CheckOut: { $gte: startOfMonth, $lt: endOfMonth } }
                    ]
                }
            },
            {
                $match: {
                    'Status': { $in: ['Successful', 'Fully-Paid', 'Reserved'] }  
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$Total' }  
                }
            }
        ]);

        if (earnings.length === 0) {
            return res.status(404).json({ message: "No earnings found for this month" });
        }
        console.log('this month:',earnings[0].totalEarnings);
        res.status(200).json({
            
            message: "Monthly earnings retrieved successfully",
            earnings: earnings[0].totalEarnings,
            period: "this month"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving monthly earnings', error });
    }
};

exports.getThisYearEarnings = async (req, res) => {
    try {
        const startOfYear = new Date('2024-01-01T00:00:00.000Z');
        const endOfYear = new Date('2024-12-31T23:59:59.000Z');

        console.log("Start of year:", startOfYear);
        console.log("End of year:", endOfYear);

        const earnings = await BookingsModel.aggregate([
            {
                $match: {
                    $or: [
                        { CheckIn: { $gte: startOfYear, $lte: endOfYear } },
                        { CheckOut: { $gte: startOfYear, $lte: endOfYear } }
                    ]
                }
            },
            {
                $match: {
                    'Status': { $in: ['Successful', 'Fully-Paid', 'Reserved'] }  
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$Total' }  
                }
            }
        ]);

        console.log("Earnings:", earnings); 

        if (earnings.length === 0) {
            return res.status(404).json({ message: "No earnings found for this year" });
        }

        res.status(200).json({
            message: "Yearly earnings retrieved successfully",
            earnings: earnings[0].totalEarnings,
            period: "this year"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving yearly earnings', error });
    }
};
