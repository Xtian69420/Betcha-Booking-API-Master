const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db'); 
const path = require('path');

const userController = require('./controllers/userController');
const unitController = require('./controllers/unitController');

const app = express();
app.use(bodyParser.json());

const cors = require('cors');


const corsOptions = {
  origin: '*',  //temporary all
  methods: '*', 
  allowedHeaders: '*',  
};

app.use(cors(corsOptions)); 

app.use((req, res, next) => {
  res.setTimeout(60000, () => { 
    res.status(408).send('Request Timeout');
  });
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.post('/Register', userController.registerUser);
app.post('/Login', userController.loginUser);
app.post('/addUnit', unitController.addUnit);
app.get('/getUserIdImage/:userId', userController.getUserIdImage);
app.get('/user/:userId', userController.getUserById);
app.get('/ping', (req, res) => {
  res.status(200).send('Server is alive!');
});
app.put('/updateUser/:userId', userController.updateUser);
app.delete('/deleteUser/:userId', userController.deleteUser);