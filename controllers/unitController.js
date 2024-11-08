const Unit = require('../collection/Unit');

exports.addUnit = async (req, res) => {
  try {
    const { unitName, location, description, inclusion, unitPrice, isAvailable, maxPax, pricePerPax } = req.body;

    const newUnit = new Unit({
      unitName,
      location,
      description,
      inclusion,
      unitPrice,
      isAvailable,
      maxPax,
      pricePerPax
    });

    const savedUnit = await newUnit.save();
    res.status(201).json({
      message: 'Unit added successfully',
      data: savedUnit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add Unit', details: error.message });
  }
};
