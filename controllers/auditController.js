const Audit = require('../collection/Audit');

exports.createAudit = async (req, res) => {
    try {
        const currentDate = new Date().toISOString();  
        
        const lastAudit = await Audit.findOne().sort({ Reference });

        const newReference = lastAudit ? parseInt(lastAudit.Reference) + 1 : 1; 

        const { UserId, Activity, Role } = req.body;

        const newAudit = new Audit({
            Reference: newReference.toString(),  
            Date: currentDate,
            UserId,
            Activity,
            Role
        });

        await newAudit.save();
        res.status(201).json({ message: 'Audit created successfully', data: newAudit });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create audit', error: error.message });
    }
};

exports.getAuditAllUsers = async (req, res) => {
    try {
        const audits = await Audit.find();
        res.status(200).json({ message: 'Audits retrieved successfully', data: audits });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve audits', error: error.message });
    }
};

exports.getAuditForAdmin = async (req, res) => {
    try {
        const audits = await Audit.find({ Role: 'Admin' });
        res.status(200).json({ message: 'Admin audits retrieved successfully', data: audits });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve admin audits', error: error.message });
    }
};

exports.getAuditForCustomer = async (req, res) => {
    try {
        const audits = await Audit.find({ Role: 'Customer' });
        res.status(200).json({ message: 'Admin audits retrieved successfully', data: audits });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve customer audits', error: error.message });
    }
};
