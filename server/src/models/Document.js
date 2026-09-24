import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Untitled Document'
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // We will store the latest Yjs Buffer update in database down the line
    yjsData: {
        type: Buffer, 
        default: null
    }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;