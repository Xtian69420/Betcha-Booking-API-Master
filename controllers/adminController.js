const Admin = require('../collection/Admin');
const bcrypt = require('bcryptjs');
const { findById } = require('../collection/Admin');
const jwt = require('jsonwebtoken');

exports.createAdmin = async (req, res)=>{
    try {
    const {email, password, adminName} = req.body || req.query;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
        email, password: hashedPassword, adminName
    });

    const savedAdmin = await newAdmin.save();
        res.status(201).json({
            message: 'Create new Admin successfully',
            data: savedAdmin
    });
    } catch (error) {
        res.status(500).json({ error: 'Failed Create new Admin', details: error.message });
    }   
};

exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required!' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' }); // Ends request if admin is not found
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid admin credentials!' }); // Ends request if password doesn't match
        }

        const token = jwt.sign({ id: admin._id }, 'your_jwt_secret', { expiresIn: '1h' });

        return res.json({
            message: 'Login Admin Successfully!',
            token,
            adminId: admin._id,
            adminName: admin.adminName,
            role: admin.role
        });  // Ends the request by sending a response with the token
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: 'Login failed', details: error.message }); // Ensures the request ends with an error message
    }
};


exports.deleteAdmin = async (req, res)=>{
    const adminId = req.params.adminId;
    try {
        const deletedAdmin = await Admin.findByIdAndDelete(adminId);
    
        if (!deletedAdmin) {
          return res.status(404).json({ error: 'Admin not found' });
        }
    
        res.status(200).json({
          message: 'Admin deleted successfully',
          data: deletedAdmin
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete Admin', details: error.message });
      }

};

exports.updateAdmin = async (req, res) => {
    const adminId = req.params.adminId;
    const { email, password, adminName } = req.body || req.query

    try {
        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const updatedData = {};

        if (email) updatedData.email = email;
        if (password) updatedData.password = await bcrypt.hash(password, 10);
        if (adminName) updatedData.adminName = adminName;

        const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updatedData, { new: true });

        res.status(200).json({
            message: 'Admin updated successfully',
            data: updatedAdmin
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update Admin', details: error.message });
    }
};


exports.getAdminInfo = async (req, res) =>{
    try{
        const adminId = req.params.adminId;

        const admin = await Admin.findById(adminId);
        if (!admin){
            res.status(404).json({
                error: 'Admin not found'
            })
        }
        res.status(200).json({
            message: 'Admin fetched successfully',
            data: admin
          });
    } catch (error) {
    res.status(500).json({ error: 'Error fetching admin', details: error.message });
    }
}
exports.getAllAdmin = async (req, res)=>{
    try {
        const admin = await Admin.find();
        res.status(200).json(admin);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch all admin', details: error.message });
      }
}
 
