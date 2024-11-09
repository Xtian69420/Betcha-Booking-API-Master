const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../collection/User');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads')); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage }).single('IdImage');

exports.registerUser = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    let { email, password, phoneNumber, firstName, middleInitial, lastName, isVerified } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Required fields: email, password, firstName, lastName!' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        email,
        password: hashedPassword,
        phoneNumber,
        firstName,
        middleInitial,
        lastName,
        isVerified,
        IdImage: req.file
          ? {
              filename: req.file.filename, 
              name: req.file.originalname,
              image: {
                data: null, 
                contentType: req.file.mimetype
              }
            }
          : undefined
      });

      const savedUser = await newUser.save();

      res.status(201).json({
        message: 'User registered successfully',
        data: savedUser
      });
    } catch (error) {
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
    const imageUrl = user.IdImage ? `/uploads/${user.IdImage.filename}` : null;

    res.status(200).json({
      message: 'User fetched successfully',
      data: {
        ...user.toObject(),
        imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user', details: error.message });
  }
};

// Update user details
exports.updateUser = async (req, res) => {
  const userId = req.params.userId; // User ID passed as URL parameter
  const { email, password, phoneNumber, firstName, middleInitial, lastName } = req.body || req.query;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for fields in the request body and update only those
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
