const NotificationModel = require('../collection/Notification');

exports.CreateNotif = async (req, res) => {
    try {
        const { fromId, toId, message, isViewed } = req.body;

        if (!fromId || !toId || !Array.isArray(toId)) {
            return res.status(400).json({ error: "Missing required fields or invalid 'toId' format." });
        }

        const newNotif = new NotificationModel({
            fromId,
            toId,
            message,
            isViewed
        });

        const savedNotif = await newNotif.save();
        res.status(201).json({ message: "Notification created successfully", data: savedNotif });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getAllNotif = async (req, res) => {
    try {
        const notifications = await NotificationModel.find();
        res.status(200).json({ data: notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getAllNotifUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const notifications = await NotificationModel.find({ "toId.to": userId });
        res.status(200).json({ data: notifications });
    } catch (error) {
        console.error("Error fetching user notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getAllNotifAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        const notifications = await NotificationModel.find({ "toId.to": adminId });
        res.status(200).json({ data: notifications });
    } catch (error) {
        console.error("Error fetching admin notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getAllNotifSuper = async (req, res) => {
    try {
        const { superAdminId } = req.params;

        const notifications = await NotificationModel.find({ "toId.to": superAdminId });
        res.status(200).json({ data: notifications });
    } catch (error) {
        console.error("Error fetching super admin notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getSpecificNtoif = async (req, res) => {
    try {
        const { notifid } = req.params;

        const notification = await NotificationModel.findById(notifid);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.status(200).json({ data: notification });
    } catch (error) {
        console.error("Error fetching specific notification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.deleteNotif = async (req, res) => {
    try {
        const { notifId } = req.params;

        const deletedNotif = await NotificationModel.findByIdAndDelete(notifId);
        if (!deletedNotif) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};