const multer = require('multer');
const { google } = require('googleapis');
const Unit = require('../collection/Unit');
const streamifier = require('streamifier');
require('dotenv').config();

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/drive.file']
  ),
});

const storage = multer.memoryStorage();
const upload = multer({ storage }).array('unitImages', 8);
// const upload = multer({ storage }).single('unitImages');
const folderId = '1WfnLJoASraDje1YVAHDlYIpKOTu0DNYh';

async function uploadToGoogleDrive(fileBuffer, fileName, mimeType, folderId) {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    const fileStream = streamifier.createReadStream(fileBuffer);

    const media = {
      mimeType: mimeType,
      body: fileStream,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return {
      fileId: response.data.id,
      fileUrl: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Failed to upload file to Google Drive:', error);
    throw new Error('Failed to upload file to Google Drive: ' + error.message);
  }
}

exports.addUnit = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    const { 
      unitName, 
      location, 
      maplink,
      description, 
      amenities, 
      otherAmenities, 
      unitPrice, 
      reservation,
      packageCapacity,
      isAvailable, 
      maxPax, 
      pricePerPax,
      category = 'others'
    } = req.body;

    const unitImages = req.files;

    try {
      const uploadedImages = await Promise.all(
        unitImages.map(async (image) => {
          const uploadedFile = await uploadToGoogleDrive(
            image.buffer,
            image.originalname,
            image.mimetype,
            folderId
          );

          return {
            filename: image.originalname,
            name: uploadedFile.fileUrl,
            fileId: uploadedFile.fileId,
            contentType: image.mimetype,
          };
        })
      );

      const newUnit = new Unit({
        unitName,
        location,
        maplink,
        description,
        amenities: JSON.parse(amenities || "{}"),
        otherAmenities,
        unitPrice,
        reservation,
        packageCapacity,
        isAvailable,
        maxPax,
        pricePerPax,
        category,  
        UnitImages: uploadedImages,
      });

      const savedUnit = await newUnit.save();
      res.status(201).json({
        message: 'Unit added successfully',
        data: savedUnit,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add Unit', details: error.message });
    }
  });
};

exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.find();
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch units', details: error.message });
  }
};

exports.getAvailableUnits = async (req, res) => {
  try {
    const availableUnits = await Unit.find({ isAvailable: true });

    if (availableUnits.length === 0) {
      return res.status(404).json({ message: 'No available units found' });
    }

    res.status(200).json(availableUnits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available units', details: error.message });
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    res.status(200).json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unit', details: error.message });
  }
};

// highest Rank
exports.getTopUnits = async (req, res) => {
  try {
    const topUnits = await Unit.find()
      .sort({ Top: 1 }) 
      .limit(5); 

    if (topUnits.length === 0) {
      return res.status(404).json({ message: 'No units found' });
    }

    res.status(200).json({
      message: 'Top 5 units retrieved successfully',
      data: topUnits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top units', details: error.message });
  }
};

// lowest rank
exports.getBottomUnits = async (req, res) => {
  try {
    const bottomUnits = await Unit.find()
      .sort({ Top: -1 }) 
      .limit(5); 

    if (bottomUnits.length === 0) {
      return res.status(404).json({ message: 'No units found' });
    }

    res.status(200).json({
      message: 'Bottom 5 units retrieved successfully',
      data: bottomUnits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bottom units', details: error.message });
  }
};


exports.editUnit = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    const updates = req.body; // Dynamically use provided fields
    const unitImages = req.files;

    try {
      if (unitImages && unitImages.length > 0) {
        const uploadedImages = await Promise.all(
          unitImages.map(async (image) => {
            const uploadedFile = await uploadToGoogleDrive(
              image.buffer,
              image.originalname,
              image.mimetype,
              folderId
            );

            return {
              filename: image.originalname,
              name: uploadedFile.fileUrl,
              fileId: uploadedFile.fileId,
              contentType: image.mimetype,
            };
          })
        );
        updates.UnitImages = uploadedImages; 
      }

      if (updates.amenities) {
        updates.amenities = JSON.parse(updates.amenities);
      }

      if (!updates.category) {
        updates.category = 'others'; 
      }

      if (updates.packageCapacity) {
        updates.packageCapacity = updates.packageCapacity;
      }

      if (updates.reservation) {
        updates.reservation = JSON.parse(updates.reservation);
      }

      const updatedUnit = await Unit.findByIdAndUpdate(req.params.id, updates, {
        new: true, 
        runValidators: true, 
      });

      if (!updatedUnit) {
        return res.status(404).json({ error: 'Unit not found' });
      }

      res.status(200).json({
        message: 'Unit updated successfully',
        data: updatedUnit,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update unit', details: error.message });
    }
  });
};


exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    for (let image of unit.UnitImages) {
      await drive.files.delete({
        fileId: image.fileId,
      });
    }

    await Unit.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Unit and associated images deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete unit', details: error.message });
  }
};

exports.searchUnits = async (req, res) => {
  const { 
    query, 
    minPrice, maxPrice, 
    minMaxPax, maxMaxPax,
    minUnitPrice, maxUnitPrice 
  } = req.body;

  let filter = {};

  if (query) {
    filter.$or = [
      { unitName: { $regex: query, $options: 'i' } },
      { location: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } }
    ];
  }

  if (minPrice || maxPrice) {
    filter.unitPrice = {};
    if (minPrice) {
      filter.unitPrice.$gte = minPrice;
    }
    if (maxPrice) {
      filter.unitPrice.$lte = maxPrice;
    }
  }

  if (minMaxPax || maxMaxPax) {
    filter.maxPax = {};
    if (minMaxPax) {
      filter.maxPax.$gte = minMaxPax;
    }
    if (maxMaxPax) {
      filter.maxPax.$lte = maxMaxPax;
    }
  }

  if (minUnitPrice || maxUnitPrice) {
    filter.unitPrice = filter.unitPrice || {};
    if (minUnitPrice) {
      filter.unitPrice.$gte = minUnitPrice;
    }
    if (maxUnitPrice) {
      filter.unitPrice.$lte = maxUnitPrice;
    }
  }

  try {

    const units = await Unit.find(filter);

    if (units.length === 0) {
      return res.status(404).json({ message: 'No units found matching the search criteria' });
    }

    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search units', details: error.message });
  }
};
