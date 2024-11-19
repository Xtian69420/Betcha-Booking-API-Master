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
      description, 
      amenities, 
      otherAmenities, 
      unitPrice, 
      isAvailable, 
      maxPax, 
      pricePerPax 
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
        description,
        amenities: JSON.parse(amenities || "{}"),
        otherAmenities,
        unitPrice,
        isAvailable,
        maxPax,
        pricePerPax,
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
