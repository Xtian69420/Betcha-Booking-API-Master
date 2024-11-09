const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../collection/User');
const multer = require('multer');
const { google } = require('googleapis');
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
const upload = multer({ storage }).single('IdImage');
const folderId = '1lEpQdJjO5awi_Gq75ue3W4jwLJajMUJk';
const streamifier = require('streamifier');

// Function to upload to Google Drive
async function uploadToGoogleDrive(fileBuffer, fileName, mimeType, folderId) {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId], // Optional: Specify the folder to upload the file to
    };

    // Convert the buffer into a stream
    const fileStream = streamifier.createReadStream(fileBuffer);

    const media = {
      mimeType: mimeType,
      body: fileStream, // Use the stream here instead of the buffer
    };

    // Upload the file to Google Drive using the global drive instance
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink', // Fields you want to retrieve after upload
    });

    // Return the file info (e.g., fileId and webViewLink)
    return {
      fileId: response.data.id,
      fileUrl: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Failed to upload file to Google Drive:', error);
    throw new Error('Failed to upload file to Google Drive: ' + error.message);
  }
}

exports.registerUser = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    console.log('Uploaded file:', req.file); // Debugging the file upload

    const { email, password, phoneNumber, firstName, middleInitial, lastName, isVerified } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Required fields: email, password, firstName, lastName!' });
    }

    // Validate image file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (req.file && !validMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid image type. Only JPG, PNG, or GIF are allowed.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Upload the image to Google Drive and get the public file URL
      const uploadedFile = await uploadToGoogleDrive(req.file.buffer, req.file.originalname, req.file.mimetype, folderId);

      console.log('Uploaded file details:', uploadedFile); // Debugging the uploaded file response

      const newUser = new User({
        email,
        password: hashedPassword,
        phoneNumber,
        firstName,
        middleInitial,
        lastName,
        isVerified,
        IdImage: uploadedFile
          ? {
              filename: uploadedFile.fileId, // Store the file ID in your DB
              name: uploadedFile.fileUrl, // Store the public file URL
              fileId: uploadedFile.fileId, // Store the file ID for reference
            }
          : undefined,
      });

      const savedUser = await newUser.save();
      console.log('Saved user:', savedUser); // Debugging saved user

      res.status(201).json({
        message: 'User registered successfully',
        data: savedUser,
      });
    } catch (error) {
      console.error('Error during user registration:', error);
      res.status(500).json({ error: 'Failed to register user', details: error.message });
    }
  });
};



exports.loginUser = async (req, res) => {
  const email = req.body.email || req.query.email; 
  const password = req.body.password || req.query.password; 

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required!' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({
      message: 'Login successful!',
      token,
      userId: user._id  
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {

    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User fetched successfully',
      data: user
    });
  } catch (error) {

    res.status(500).json({ error: 'Error fetching user', details: error.message });
  }
};

exports.getUserIdImage = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.IdImage && user.IdImage.fileId) {
      // Create a Google Drive service instance
      const drive = google.drive({
        version: 'v3',
        auth: new google.auth.JWT(
          process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          null,
          process.env.GOOGLE_PRIVATE_KEY,
          ['https://www.googleapis.com/auth/drive.readonly']
        ),
      });

      // Get the file from Google Drive using the file ID
      const file = await drive.files.get({
        fileId: user.IdImage.fileId,
        fields: 'webContentLink', // Retrieve the web content link (URL) of the file
      });

      const imageUrl = file.data.webContentLink; // Google Drive URL for file download

      res.status(200).json({
        message: 'User fetched successfully',
        data: {
          ...user.toObject(),
          imageUrl,  // Send the URL of the image
        },
      });
    } else {
      res.status(404).json({ error: 'No image found for this user' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user', details: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.params.userId; 
  const { email, password, phoneNumber, firstName, middleInitial, lastName } = req.body || req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedData = {};

    if (email) updatedData.email = email;
    if (password) updatedData.password = await bcrypt.hash(password, 10); 
    if (phoneNumber) updatedData.phoneNumber = phoneNumber;
    if (firstName) updatedData.firstName = firstName;
    if (middleInitial) updatedData.middleInitial = middleInitial;
    if (lastName) updatedData.lastName = lastName;

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.userId; 

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User deleted successfully',
      data: deletedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
};
