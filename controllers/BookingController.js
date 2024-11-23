const BookingsModel = require('../collection/Bookings');
const UnitModel = require('../collection/Unit');
const CounterModel = require('../collection/Counter'); 
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
        
        const BookDates = generateDateRange(CheckIn, CheckOut);
        
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
            CheckIn,
            CheckOut,
            UserId,
            UnitId,
            BookDates: BookDates.map(date => ({ Date: date })),
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
        const BookDates = generateDateRange(CheckIn, CheckOut);

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

        booking.CheckIn = CheckIn;
        booking.CheckOut = CheckOut;
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
        const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}: ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        booking.EditStatusDates.push({
            Date: formattedDateTime,
            Update: Status
        });

        booking.Status = Status;

        await booking.save();

        res.status(200).json({ message: 'Booking status successfully updated', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating booking status', error });
    }
};


exports.getBookingUnit = async (req, res) => {
    try {
        const { unitId } = req.params;

        const bookings = await BookingsModel.find({ UnitId: unitId }).populate('PaymentId');
        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving bookings', error });
    }
};

exports.getOneBooking = async (req, res) => {
    try {
        const { reference } = req.params;

        const booking = await BookingsModel.findOne({ Reference: reference }).populate('PaymentId');
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

        const bookings = await BookingsModel.find().populate('PaymentId');
        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving bookings', error });
    }
};

exports.getBookingUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const bookings = await BookingsModel.find({ userId: userId }).populate('PaymentId');
        
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
        });

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No valid bookings found for this unit" });
        }

        const allBookedDates = [];
        bookings.forEach(booking => {
            booking.BookDates.forEach(dateEntry => {
                allBookedDates.push(dateEntry.Date);
            });
        });

        res.status(200).json({ message: "Booked dates retrieved successfully", bookedDates: allBookedDates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching booked dates", error });
    }
};