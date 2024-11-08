const mongoose = require('mongoose');
const dbURI = 'mongodb+srv://test-admin:test1234@testlogin.jszgh.mongodb.net/?retryWrites=true&w=majority&appName=testlogin';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

module.exports = mongoose;
