const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db'); 

const userController = require('./controllers/userController');
const unitController = require('./controllers/unitController');

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setTimeout(60000, () => { 
    res.status(408).send('Request Timeout');
  });
  next();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Routes of APIs
app.post('/Register', userController.registerUser);
app.post('/Login', userController.loginUser);
app.post('/addUnit', unitController.addUnit);
app.get('/user/:userId', userController.getUserById);
app.get('/ping', (req, res) => {
  res.status(200).send('Server is alive!');
});