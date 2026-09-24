import { WebSocketServer } from 'ws';
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils';
import jwt from 'jsonwebtoken';
import Document from '../models/Document.js';

// Fix for Yjs double-instantiation constructor issues (CommonJS vs ESM)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Y = require('yjs');

// Setup Persistence
setPersistence({
  bindState: async (docName, ydoc) => {
    try {
      // Because y-websocket sometimes prefixes room names or is just a string Document ID, 
      // we attempt to find the Document by ID.
      const dbDoc = await Document.findById(docName);
      if (dbDoc && dbDoc.yjsData) {
        Y.applyUpdate(ydoc, dbDoc.yjsData);
      }
    } catch (err) {
      console.error(`[Sync Server] Error binding state for doc ${docName}:`, err.message);
    }
  },
  writeState: async (docName, ydoc) => {
    try {
      const yjsData = Buffer.from(Y.encodeStateAsUpdate(ydoc));
      await Document.findByIdAndUpdate(docName, { yjsData });
    } catch (err) {
      console.error(`[Sync Server] Error writing state for doc ${docName}:`, err.message);
    }
  }
});


export function setupSyncServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  console.log(`[Sync Server] setupWSConnection is a type of: ${typeof setupWSConnection}`);

  wss.on('connection', (conn, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const docName = url.pathname.replace(/^\/ws\/?/, '') || 'default-doc';
    console.log(`[Sync Server] New connection on room: ${docName}`);
    
    try {
      setupWSConnection(conn, req, { docName });
      console.log(`[Sync Server] Successfully established Yjs doc for room: ${docName}`);
    } catch (e) {
      console.error('[Sync Server] Error in setupWSConnection:', e);
    }
  });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    // Handle WebSocket upgrade for sync endpoint
    if (pathname.startsWith('/ws')) {
      console.log(`[Upgrade] Upgrade request intercepted for ${pathname}`);
      
      const token = url.searchParams.get('token');
      if (!token) {
        console.log(`[Upgrade] Blocked unauthorized connection to ${pathname}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } catch (err) {
        console.log(`[Upgrade] Blocked invalid token for ${pathname}: ${err.message}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    } else {
      console.log(`[Upgrade] Ignored non-/ws upgrade: ${pathname}`);
    }
  });

  console.log('[Sync Server] WebSocket server setup complete on /ws route');
  return wss;
}
