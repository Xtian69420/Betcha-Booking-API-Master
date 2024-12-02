const Audit = require('../collection/Audit');

exports.createAudit = async (req, res) => {
    try {
        const currentDate = new Date().toISOString();
        
        const lastAudit = await Audit.findOne()
            .sort({ Reference: -1 })
            .collation({ locale: "en", numericOrdering: true });

        const newReference = lastAudit ? lastAudit.Reference + 1 : 1;

        const { UserId, Activity, Role } = req.body;

        const newAudit = new Audit({
            Reference: newReference,
            Date: currentDate,
            UserId,
            Activity,
            Role
        });

        await newAudit.save();
        res.status(201).json({ message: 'Audit created successfully', data: newAudit });
    } catch (error) {
        console.error('Error creating audit:', error);
        res.status(500).json({ message: 'Failed to create audit', error: error.message });
    }
};

const mongoose = require("mongoose");

exports.getAuditAllUsers = async (req, res) => {
    try {
        const audits = await Audit.aggregate([
            {
                $addFields: {
                    userIdAsObjectId: { $toObjectId: "$UserId" },
                },
            },
            {
                $lookup: {
                    from: "admin_tb", 
                    localField: "userIdAsObjectId",
                    foreignField: "_id",
                    as: "adminDetails",
                },
            },
            {
                $lookup: {
                    from: "super_admin_tb", 
                    localField: "userIdAsObjectId",
                    foreignField: "_id",
                    as: "superAdminDetails",
                },
            },
            {
                $lookup: {
                    from: "user_tb", 
                    localField: "userIdAsObjectId",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            {
                $addFields: {
                    Username: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ["$Role", "Admin"] },
                                    then: { $arrayElemAt: ["$adminDetails.adminName", 0] },
                                },
                                {
                                    case: { $eq: ["$Role", "SuperAdmin"] },
                                    then: { $arrayElemAt: ["$superAdminDetails.superAdminName", 0] },
                                },
                                {
                                    case: { $eq: ["$Role", "Customer"] },
                                    then: {
                                        $concat: [
                                            { $arrayElemAt: ["$userDetails.firstName", 0] },
                                            " ",
                                            { $arrayElemAt: ["$userDetails.lastName", 0] },
                                        ],
                                    },
                                },
                            ],
                            default: "Unknown User",
                        },
                    },
                },
            },
            {
                $project: {
                    adminDetails: 0,
                    superAdminDetails: 0,
                    userDetails: 0,
                    userIdAsObjectId: 0,
                },
            },
            {
                $sort: { Reference: -1 }, 
            },
        ]);

        res.status(200).json({ message: "Audits retrieved successfully", data: audits });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve audits", error: error.message });
    }
};


exports.getAuditForAdmin = async (req, res) => {
    try {
        const audits = await Audit.aggregate([
            {
                $match: { Role: { $in: ["Admin", "SuperAdmin"] } },
            },
            {
                $addFields: {
                    userIdAsObjectId: { $toObjectId: "$UserId" },
                },
            },
            {
                $lookup: {
                    from: "admin_tb", 
                    localField: "userIdAsObjectId",
                    foreignField: "_id",
                    as: "adminDetails",
                },
            },
            {
                $lookup: {
                    from: "super_admin_tb", 
                    localField: "userIdAsObjectId",
                    foreignField: "_id",
                    as: "superAdminDetails",
                },
            },
            {
                $addFields: {
                    Username: {
                        $cond: [
                            { $eq: ["$Role", "Admin"] },
                            { $arrayElemAt: ["$adminDetails.adminName", 0] },
                            { $arrayElemAt: ["$superAdminDetails.superAdminName", 0] },
                        ],
                    },
                },
            },
            {
                $project: {
                    adminDetails: 0,
                    superAdminDetails: 0,
                    userIdAsObjectId: 0,
                },
            },
        ]);

        res.status(200).json({ message: "Admin audits retrieved successfully", data: audits });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve admin audits", error: error.message });
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
