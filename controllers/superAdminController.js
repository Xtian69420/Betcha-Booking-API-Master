const SuperAdmin = require('../collection/SuperAdmin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createSuperAdmin = async (req, res) => {
    try {
        const { email, password, superAdminName } = req.body || req.query;
    
        const hashedPassword = await bcrypt.hash(password, 10);

        const newSuperAdmin = new SuperAdmin({
            email, password: hashedPassword, superAdminName
        });

        const savedSuperAdmin = await newSuperAdmin.save();
        res.status(201).json({
            message: 'Create new SuperAdmin successfully',
            data: savedSuperAdmin
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create new SuperAdmin', details: error.message });
    }   
};

exports.loginSuperAdmin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required!' });
    }

    try {
        const superAdmin = await SuperAdmin.findOne({ email });
        if (!superAdmin) {
            return res.status(404).json({ error: 'SuperAdmin not found' }); // Ends request if super admin is not found
        }

        const isMatch = await bcrypt.compare(password, superAdmin.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid SuperAdmin credentials!' }); // Ends request if password doesn't match
        }

        const token = jwt.sign({ id: superAdmin._id }, 'your_jwt_secret', { expiresIn: '1h' });

        return res.json({
            message: 'Login SuperAdmin successfully!',
            token,
            superAdminId: superAdmin._id
        }); // Ends the request by sending a response with the token
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: 'Login failed', details: error.message }); // Ensures the request ends with an error message
    }
};


exports.deleteSuperAdmin = async (req, res) => {
    const superAdminId = req.params.superAdminId;
    try {
        const deletedSuperAdmin = await SuperAdmin.findByIdAndDelete(superAdminId);
    
        if (!deletedSuperAdmin) {
            return res.status(404).json({ error: 'SuperAdmin not found' });
        }
    
        res.status(200).json({
            message: 'SuperAdmin deleted successfully',
            data: deletedSuperAdmin
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete SuperAdmin', details: error.message });
    }
};

exports.updateSuperAdmin = async (req, res) => {
    const superAdminId = req.params.superAdminId;
    const { email, password, superAdminName } = req.body || req.query;

    try {
        const superAdmin = await SuperAdmin.findById(superAdminId);

        if (!superAdmin) {
            return res.status(404).json({ error: 'SuperAdmin not found' });
        }

        const updatedData = {};

        if (email) updatedData.email = email;
        if (password) updatedData.password = await bcrypt.hash(password, 10);
        if (superAdminName) updatedData.superAdminName = superAdminName;

        const updatedSuperAdmin = await SuperAdmin.findByIdAndUpdate(superAdminId, updatedData, { new: true });

        res.status(200).json({
            message: 'SuperAdmin updated successfully',
            data: updatedSuperAdmin
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update SuperAdmin', details: error.message });
    }
};

const mongoose = require('mongoose');

exports.getSuperAdminInfo = async (req, res) => {
    try {
        const superAdminId = req.params.superAdminId;
        if (!mongoose.Types.ObjectId.isValid(superAdminId)) {
            return res.status(404).json({
                error: 'Invalid SuperAdmin ID format'
            });
        }

        const superAdmin = await SuperAdmin.findById(superAdminId);
        if (!superAdmin) {
            return res.status(404).json({
                error: 'SuperAdmin not found'
            });
        }

        res.status(200).json({
            message: 'SuperAdmin fetched successfully',
            data: superAdmin
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching SuperAdmin', details: error.message });
    }
};


exports.getAllSuperAdmin = async (req, res) => {
    try {
        const superAdmins = await SuperAdmin.find();
        res.status(200).json(superAdmins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch all SuperAdmins', details: error.message });
    }
};

exports.getSuperAdminInfo = async (req, res) => {
    try {
        const superAdminId = req.params.superAdminId;

        const superAdmin = await SuperAdmin.findById(superAdminId); // The variable name here should be `superAdmin`, not `Superadmin`
        if (!superAdmin) {
            return res.status(404).json({
                error: 'SuperAdmin not found'
            });
        }
        res.status(200).json({
            message: 'SuperAdmin fetched successfully',
            data: superAdmin // Use `superAdmin` instead of `admin`
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching SuperAdmin', details: error.message });
    }
};

