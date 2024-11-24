const FAQsModel = require('../collection/FAQs');

exports.CreateFaqs = async (req, res) => {
    try {
        const { Question, Answer } = req.body; 
        const newFAQ = new FAQsModel({ Question, Answer });
        await newFAQ.save();
        res.status(201).json({ message: 'FAQ created successfully', data: newFAQ });
    } catch (error) {
        res.status(500).json({ message: 'Error creating FAQ', error: error.message });
    }
};

exports.GetAllFaqs = async (req, res) => {
    try {
        const faqs = await FAQsModel.find();
        res.status(200).json({ message: 'FAQs retrieved successfully', data: faqs });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving FAQs', error: error.message });
    }
};

exports.GetSpecificFaqs = async (req, res) => {
    try {
        const { id } = req.params;
        const faq = await FAQsModel.findById(id);
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        res.status(200).json({ message: 'FAQ retrieved successfully', data: faq });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving FAQ', error: error.message });
    }
};

exports.UpdateFaqs = async (req, res) => {
    try {
        const { id } = req.params;
        const { Question, Answer } = req.body;
        const updatedFAQ = await FAQsModel.findByIdAndUpdate(
            id,
            { Question, Answer },
            { new: true, runValidators: true }
        );
        if (!updatedFAQ) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        res.status(200).json({ message: 'FAQ updated successfully', data: updatedFAQ });
    } catch (error) {
        res.status(500).json({ message: 'Error updating FAQ', error: error.message });
    }
};

exports.Deletefaqs = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedFAQ = await FAQsModel.findByIdAndDelete(id);
        if (!deletedFAQ) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting FAQ', error: error.message });
    }
};