const path = require('path');

const TutorProfile = require('../models/TutorProfile');
const { uploadDir } = require('../middleware/upload');

exports.uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded' });
    }

    const stored = req.files.map((file) => file.filename);

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { documents: { $each: stored } } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, documents: profile.documents });
  } catch (error) {
    return next(error);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const requested = path.basename(req.params.filename);

    const ownsDocument = await TutorProfile.exists({
      user: req.user._id,
      documents: requested,
    });

    if (!ownsDocument && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You cannot access this document' });
    }

    const filePath = path.join(uploadDir, requested);
    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.removeDocument = async (req, res, next) => {
  try {
    const requested = path.basename(req.params.filename);
    const fs = require('fs');

    const profile = await TutorProfile.findOne({ user: req.user._id });
    if (!profile || !profile.documents.includes(requested)) {
      return res.status(404).json({ success: false, message: 'Document not found on your profile' });
    }

    profile.documents = profile.documents.filter((item) => item !== requested);
    await profile.save();

    fs.unlink(path.join(uploadDir, requested), () => {});

    return res.status(200).json({ success: true, documents: profile.documents });
  } catch (error) {
    return next(error);
  }
};
