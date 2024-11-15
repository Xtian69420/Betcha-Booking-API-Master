# 🚀 **Betcha-Booking API-Backend**

---

## **Dependencies**

| **API**         | **Usage**                                                                 |
|------------------|---------------------------------------------------------------------------|
| <span style="color:#4CAF50;">MongoDB</span>      | Database for storing application data                                        |
| <span style="color:#2196F3;">Mongoose</span>     | ODM for MongoDB, managing schemas and models                                |
| <span style="color:#FF5722;">Express</span>      | Web framework for building RESTful APIs                                     |
| <span style="color:#795548;">Node.js</span>      | Runtime environment for executing server-side JavaScript                    |
| <span style="color:#FFC107;">jsonwebtoken</span> | Authentication and secure communication via tokens                         |
| <span style="color:#009688;">bcryptjs</span>     | Password hashing for securing user credentials                             |
| <span style="color:#3F51B5;">Gdrive API</span>   | Integration with Google Drive for file storage                              |
| <span style="color:#9C27B0;">MongoPay</span>     | Payment gateway integration                                                |
| <span style="color:#FF9800;">FS</span>           | File system module for file operations                                     |
| <span style="color:#673AB7;">Multer</span>       | Middleware for handling file uploads in `multipart/form-data`              |

---

## 📋 **How to Use**

### 1️⃣ **Setup**

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/Xtian69420/Betcha-Booking-API-Master.git
2. cd <project_directory>
3. npm install
------------------------------
### 2️⃣ **Usage Instructions**
------------------------------
***1. JSONWEBTOKEN(JWT):***
```
app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password');
    
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password');

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.header('auth-token', token).send(token);
});
```
------------------------------
***2. Multer:***
```
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    res.send({ message: 'File uploaded successfully', file: req.file });
});
```
------------------------------
***3. Google API:***
```
const { google } = require('googleapis');

const uploadToDrive = async (filePath) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'path-to-credentials.json',
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.create({
        requestBody: {
            name: 'uploaded_file',
            mimeType: 'application/octet-stream',
        },
        media: {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(filePath),
        },
    });

    console.log('File uploaded successfully:', response.data);
};
```
------------------------------
To start the project:
```bash
   node server.js
