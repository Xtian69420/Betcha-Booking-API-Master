const Booking = require('../collection/Bookings');
const Unit = require('../collection/Unit');

const calculateUnitStats = async (filter = {}) => {
    const bookings = await Booking.find(filter)
        .populate('UnitId', 'unitName unitPrice description location'); // Include location here

    const unitStats = {};

    bookings.forEach((booking) => {
        const { UnitId, BookDates, Total } = booking;

        if (!unitStats[UnitId._id]) {
            unitStats[UnitId._id] = {
                unitId: UnitId._id,
                unitName: UnitId.unitName, // unitName
                location: UnitId.location, // location now included
                top: 0,
                totalDays: 0,
                totalEarnings: 0,
            };
        }

        const daysBooked = BookDates.length;

        unitStats[UnitId._id].totalDays += daysBooked;
        unitStats[UnitId._id].totalEarnings += Total;
    });

    const rankedUnits = Object.values(unitStats).sort((a, b) => b.totalEarnings - a.totalEarnings);

    rankedUnits.forEach((unit, index) => {
        unit.top = index + 1;
    });

    return rankedUnits;
};



exports.getMonth = async (req, res) => {
    try {
        const { month, year } = req.params; 

        if (month < 1 || month > 12) {
            return res.status(400).json({ message: "Invalid month. It should be between 1 and 12." });
        }

        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1900 || year > currentYear) {
            return res.status(400).json({ message: "Invalid year. Please provide a valid year." });
        }

        const startOfMonth = new Date(year, month - 1, 1);  
        const endOfMonth = new Date(year, month, 0);  

        console.log('Start of Month:', startOfMonth);
        console.log('End of Month:', endOfMonth);

        const stats = await calculateUnitStats({
            CheckIn: { $gte: startOfMonth.toISOString(), $lte: endOfMonth.toISOString() },
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAnnual = async (req, res) => {
    try {
        const { year } = req.params;  
        const currentDate = new Date();

        if (isNaN(year) || year < 1900 || year > currentDate.getFullYear()) {
            return res.status(400).json({ message: "Invalid year. Please provide a valid year." });
        }

        const startOfYear = new Date(year, 0, 1);  
        const endOfYear = new Date(year, 11, 31);  

        console.log('Start of Year:', startOfYear);
        console.log('End of Year:', endOfYear);

        const stats = await calculateUnitStats({
            CheckIn: { $gte: startOfYear.toISOString(), $lte: endOfYear.toISOString() },
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllDates = async (req, res) => {
    try {
        const stats = await calculateUnitStats();

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTopForUnits = async (req, res) => {
    try {
        const rankedUnits = await calculateUnitStats();

        const updatePromises = rankedUnits.map(async (unit, index) => {
            const updatedUnit = await Unit.findByIdAndUpdate(
                unit.unitId,
                { Top: unit.top }, 
                { new: true } 
            );

            return updatedUnit;
        });

        const updatedUnits = await Promise.all(updatePromises);

        res.status(200).json({
            message: "Top rankings updated successfully for all units",
            data: updatedUnits,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update Top rankings for units", error: error.message });
    }
};
