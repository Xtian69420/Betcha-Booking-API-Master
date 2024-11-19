const mongoose = require('mongoose');
const initializeCounter = async () => {
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
initializeCounter();

const BookingSchema = mongoose.Schema({
    Reference: { type: String, required: true },
    Date: { type: String, required: true },
    CheckIn: { type: String, required: true },
    BookDates: [{ 
        Date: {type: String, required: true }}],
    CheckOut: { type: String, required: true },
    UnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true }, 
    AdditionalPax: { type: Number, min: 1, required: true },
    Reservation: { type: Number, Default: 500 },
    isSuccess: { type: Boolean, Default: false, set: v => v === 'TRUE' },
    Status: { type: String, Default: "No status" },
    Total: { type: Number, required: true }
},{
    collection: 'bookings_tb'
})
module.exports = mongoose.model('Bookings', BookingSchema);