import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/collaborative-editor';
        await mongoose.connect(uri);
        console.log(`[Database] MongoDB Connected: ${uri}`);
    } catch (error) {
        console.error(`[Database] Error: ${error.message}`);
        process.exit(1);
    }
};
