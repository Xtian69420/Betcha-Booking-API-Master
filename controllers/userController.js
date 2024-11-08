const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../collection/User');

exports.registerUser = async (req, res) => {

  let { email, password, phoneNumber, firstName, middleInitial, lastName, isVerified } = req.body;

  email = email || req.query.email;
  password = password || req.query.password;
  phoneNumber = phoneNumber || req.query.phoneNumber;
  firstName = firstName || req.query.firstName;
  middleInitial = middleInitial || req.query.middleInitial;
  lastName = lastName || req.query.lastName;
  isVerified = isVerified || req.query.isVerified;

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
      isVerified
    });

    const savedUser = await newUser.save();
    res.status(201).json({
      message: 'User registered successfully',
      data: savedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
};



exports.loginUser = async (req, res) => {
  // Extracting the parameters from either query or body (for form data)
  const email = req.body.email || req.query.email; 
  const password = req.body.password || req.query.password; 

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required!' });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: 'Invalid Credentials!' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid Credentials' });
  }

  const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

  res.json({
    message: 'Login successful!',
    token: token,
    userId: user._id  
  });
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
