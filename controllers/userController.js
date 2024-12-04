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
const folderId = '1sL-VBECK9rMbBnJqxtL52IObJTrwysno';
const streamifier = require('streamifier');

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

exports.registerUser = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    console.log('Uploaded file:', req.file);

    const { email, password, phoneNumber, firstName, middleInitial, lastName, sex, bday, isVerified } = req.body;
    if (!email || !password || !firstName || !lastName || !sex) {
      return res.status(400).json({ error: 'Required fields: email, password, firstName, lastName!' });
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (req.file && !validMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid image type. Only JPG, PNG, or GIF are allowed.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const uploadedFile = await uploadToGoogleDrive(req.file.buffer, req.file.originalname, req.file.mimetype, folderId);

      console.log('Uploaded file details:', uploadedFile); 

      const newUser = new User({
        email,
        password: hashedPassword,
        phoneNumber,
        firstName,
        middleInitial,
        lastName,
        bday,
        sex,
        isVerified,
        IdImage: uploadedFile
          ? {
              filename: uploadedFile.fileId, 
              name: uploadedFile.fileUrl, 
              fileId: uploadedFile.fileId, 
            }
          : undefined,
      });

      const savedUser = await newUser.save();
      console.log('Saved user:', savedUser); 

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
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required!' });
  }

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ error: 'Customer not found' }); // Ends request if customer is not found
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ error: 'Invalid credentials!' }); // Ends request if password doesn't match
      }

      const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

      return res.json({
          message: 'Login successful!',
          token,
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          role: user.role
      }); // Ends the request by sending a response with the token
  } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ error: 'Login failed', details: error.message }); // Ensures the request ends with an error message
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
      const drive = google.drive({
        version: 'v3',
        auth: new google.auth.JWT(
          process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          null,
          process.env.GOOGLE_PRIVATE_KEY,
          ['https://www.googleapis.com/auth/drive.readonly']
        ),
      });

      const file = await drive.files.get({
        fileId: user.IdImage.fileId,
        fields: 'webContentLink', 
      });

      const imageUrl = file.data.webContentLink; 

      res.status(200).json({
        message: 'User fetched successfully',
        data: {
          ...user.toObject(),
          imageUrl,  
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
  const { email, password, phoneNumber, firstName, middleInitial, lastName, bday, sex, isVerified } = req.body || req.query;

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
    if (bday) updatedData.bday = bday;
    if (sex) updatedData.sex = sex;
    if (isVerified !== undefined && isVerified !== null) {
      updatedData.isVerified = isVerified;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
};

exports.updateUserByEmail = async (req, res) => {
  const { email } = req.body || req.query; 
  const { password, phoneNumber, firstName, middleInitial, lastName, bday, sex, isVerified } = req.body || req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required to find the user' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedData = {};

    if (password) updatedData.password = await bcrypt.hash(password, 10); 
    if (phoneNumber) updatedData.phoneNumber = phoneNumber;
    if (firstName) updatedData.firstName = firstName;
    if (middleInitial) updatedData.middleInitial = middleInitial;
    if (lastName) updatedData.lastName = lastName;
    if (bday) updatedData.bday = bday;
    if (sex) updatedData.sex = sex;
    if (isVerified !== undefined && isVerified !== null) {
      updatedData.isVerified = isVerified;
    }

    const updatedUser = await User.findOneAndUpdate({ email }, updatedData, { new: true });

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

const profileImageFolderId = "1na-zyeguXEpK5WEKWOQVd2VQuqStHgRB"; 

exports.uploadProfileImage = async (req, res) => {
  const upload = multer({ storage }).single('profileImage');
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.params.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid image type. Only JPG, PNG, or GIF are allowed.' });
      }

      const uploadedFile = await uploadToGoogleDrive(req.file.buffer, req.file.originalname, req.file.mimetype, profileImageFolderId);

      user.profileImage = {
        filename: req.file.originalname,
        name: uploadedFile.fileUrl,
        fileId: uploadedFile.fileId,
      };

      await user.save();

      res.status(200).json({
        message: 'Profile image uploaded successfully',
        data: user.profileImage,
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ error: 'Failed to upload profile image', details: error.message });
    }
  });
};

exports.getProfileImage = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fileId = user.profileImage?.fileId || '1z1GP6qBTsl8uLLEqAjexZwTa1KPSEnRS';

    const file = await drive.files.get({
      fileId: fileId,
      fields: 'webContentLink',
    });

    res.status(200).json({
      message: 'Profile image fetched successfully',
      imageUrl: file.data.webContentLink,
    });
  } catch (error) {
    console.error('Error fetching profile image:', error.message);
    res.status(500).json({
      error: 'Failed to fetch profile image',
      details: error.message,
    });
  }
};

exports.updateProfileImage = async (req, res) => {
  try {
    await exports.uploadProfileImage(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile image', details: error.message });
  }
};

exports.deleteProfileImage = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profileImage && user.profileImage.fileId) {
      await drive.files.delete({ fileId: user.profileImage.fileId });
      user.profileImage = {
        filename: '',
        name: '',
        fileId: '',
      };
      await user.save();

      res.status(200).json({ message: 'Profile image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Profile image not found' });
    }
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({ error: 'Failed to delete profile image', details: error.message });
  }
};

exports.getUnverifiedUsers = async (req, res) => {
  try {
    const unverifiedUsers = await User.find({ isVerified: false });

    if (unverifiedUsers.length === 0) {
      return res.status(404).json({ message: 'No unverified users found' });
    }

    res.status(200).json({
      message: 'Unverified users fetched successfully',
      count: unverifiedUsers.length,
      data: unverifiedUsers,
    });
  } catch (error) {
    console.error('Error fetching unverified users:', error);
    res.status(500).json({ error: 'Failed to fetch unverified users', details: error.message });
  }
};

exports.getVerifiedUsers = async (req, res) => {
  try {
    const unverifiedUsers = await User.find({ isVerified: true });

    if (unverifiedUsers.length === 0) {
      return res.status(404).json({ message: 'No verified users found' });
    }

    res.status(200).json({
      message: 'verified users fetched successfully',
      count: unverifiedUsers.length,
      data: unverifiedUsers,
    });
  } catch (error) {
    console.error('Error fetching verified users:', error);
    res.status(500).json({ error: 'Failed to fetch verified users', details: error.message });
  }
};