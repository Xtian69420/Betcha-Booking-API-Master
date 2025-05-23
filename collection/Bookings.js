const mongoose = require('mongoose');
/*const initializeCounter = async () => {
    try {
        const existingCounter = await CounterModel.findOne({ collectionName: 'bookings' });

        if (!existingCounter) {
            const counter = new CounterModel({ collectionName: 'bookings', sequenceValue: 1 });
            await counter.save();
            console.log("Counter initialized");
        } else {
            console.log("Counter already initialized");
        }
    } catch (error) {
        console.error("Error initializing counter:", error);
    }
};
initializeCounter();*/

const BookingSchema = mongoose.Schema({
    Reference: { type: String, required: true },
    Date: { type: Date, required: true }, 
    CheckIn: { type: Date, required: true }, 
    BookDates: [{ 
        Date: {type: String, required: true } 
    }],
    NumOfDays: { type: Number, minimum: 1 },
    CheckOut: { type: Date, required: true }, 
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    UnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true }, 
    AdditionalPax: { type: Number, min: 0, required: true },
    Reservation: { type: Number, Default: 500 },
    isSuccess: { type: Boolean, Default: false, set: v => v === 'TRUE' },
    Status: { type: String, Default: "No status" },
    PaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payments'}, 
    Total: { type: Number, required: true },
    EditStatusDates: [{
        Date: { type: Date },
        Update: { type: String }
    }]
}, {
    collection: 'bookings_tb'
});

module.exports = mongoose.model('Bookings', BookingSchema);
