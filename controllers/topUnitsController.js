const Booking = require('../collection/Bookings');
const Unit = require('../collection/Unit');

const calculateUnitStats = async (filter = {}) => {
    const bookings = await Booking.find(filter)
        .populate('UnitId', 'unitName unitPrice description location UnitImages');  // Include UnitImages in the populate

    const unitStats = {};
    let totalEarningsAllUnits = 0;

    bookings.forEach((booking) => {
        const { UnitId, BookDates, Total, Status } = booking;

        if (["Cancelled", "Did not arrive", "Unpaid"].includes(Status)) {
            return; 
        }

        if (!unitStats[UnitId._id]) {
            unitStats[UnitId._id] = {
                unitId: UnitId._id,
                unitName: UnitId.unitName, 
                location: UnitId.location, 
                top: 0,
                totalDays: 0,
                totalEarnings: 0,
                statuses: [],
                unitImages: UnitId.UnitImages || []  // Add UnitImages to the unitStats object
            };
        }

        const daysBooked = BookDates.length;

        unitStats[UnitId._id].totalDays += daysBooked;
        unitStats[UnitId._id].totalEarnings += Total;
        unitStats[UnitId._id].statuses.push(Status);

        totalEarningsAllUnits += Total;
    });

    const rankedUnits = Object.values(unitStats).sort((a, b) => b.totalEarnings - a.totalEarnings);

    rankedUnits.forEach((unit, index) => {
        unit.top = index + 1;
    });

    return { rankedUnits, totalEarningsAllUnits };
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

        const { rankedUnits, totalEarningsAllUnits } = await calculateUnitStats({
            CheckIn: { $gte: startOfMonth.toISOString(), $lte: endOfMonth.toISOString() },
        });

        res.json({ rankedUnits, totalEarningsAllUnits });
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

        const { rankedUnits, totalEarningsAllUnits } = await calculateUnitStats({
            CheckIn: { $gte: startOfYear.toISOString(), $lte: endOfYear.toISOString() },
        });

        res.json({ rankedUnits, totalEarningsAllUnits });
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
        const { rankedUnits } = await calculateUnitStats();

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

exports.topUnits = async (req, res) => {
    try {
        const { rankedUnits } = await calculateUnitStats();  

        const topUnits = rankedUnits.slice(0, 5);  // Adjust the slicing logic as needed for your metric (e.g., based on 'top' or earnings)

        res.status(200).json({
            message: "Top 5 units retrieved successfully",
            data: topUnits.map(unit => ({
                unitId: unit.unitId,
                unitName: unit.unitName,
                location: unit.location,
                top: unit.top,
                unitImages: unit.unitImages  // Include the UnitImages field
            })),
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve top units", error: error.message });
    }
};


exports.bottomUnits = async (req, res) => {
    try {
        const { rankedUnits } = await calculateUnitStats();  

        // Sort the units in descending order based on a field (e.g., 'top')
        const sortedUnits = rankedUnits.sort((a, b) => b.top - a.top);

        // Take the last 5 units (these are the bottom units)
        const bottomUnits = sortedUnits.slice(-5);

        res.status(200).json({
            message: "Bottom 5 units retrieved successfully",
            data: bottomUnits.map(unit => ({
                unitId: unit.unitId,
                unitName: unit.unitName,
                location: unit.location,
                top: unit.top,
                unitImages: unit.unitImages  
            })),
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve bottom units", error: error.message });
    }
};
