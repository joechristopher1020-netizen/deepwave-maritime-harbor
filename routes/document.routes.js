const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Upload Document
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const { documentName, documentType, fileSize, filePath, fileUrl, category, description, tags } = req.body;

    const document = new Document({
      userId: req.user.userId,
      uploadedBy: 'user',
      documentName,
      documentType,
      fileSize,
      filePath,
      fileUrl,
      category,
      description,
      tags
    });

    await document.save();
    res.status(201).json({ message: 'Document uploaded', document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Documents
router.get('/', verifyToken, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.userId, deletedAt: null });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Document by ID
router.get('/:documentId', verifyToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share Document
router.post('/:documentId/share', verifyToken, async (req, res) => {
  try {
    const { userId, permission } = req.body;
    const document = await Document.findByIdAndUpdate(
      req.params.documentId,
      {
        isShared: true,
        $push: {
          sharedWith: {
            userId,
            permission,
            sharedAt: new Date()
          }
        }
      },
      { new: true }
    );
    res.json({ message: 'Document shared', document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Document
router.delete('/:documentId', verifyToken, async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.documentId,
      { deletedAt: new Date() },
      { new: true }
    );
    res.json({ message: 'Document deleted', document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
