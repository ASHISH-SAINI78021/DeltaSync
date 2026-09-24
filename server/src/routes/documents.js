import express from 'express';
import Document from '../models/Document.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all documents for the authenticated user
router.get('/', requireAuth, async (req, res) => {
    try {
        const documents = await Document.find({ ownerId: req.user.userId }).sort({ updatedAt: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Create a new document
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title } = req.body;
        const newDoc = await Document.create({
            title: title || 'Untitled Document',
            ownerId: req.user.userId
        });
        res.status(201).json(newDoc);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create document' });
    }
});

export default router;