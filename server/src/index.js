import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSyncServer } from './websocket/syncServer.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import aiRoutes from './routes/ai.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Collaborative Editor Server Running' });
});

// Authentication Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);

const server = http.createServer(app);

// Setup y-websocket CRDT sync server
setupSyncServer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint running on ws://localhost:${PORT}/ws/<doc-name>`);
});