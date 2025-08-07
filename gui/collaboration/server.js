const WebSocket = require('ws');
const crypto = require('crypto');

class CollaborationServer {
  constructor(port = 3001) {
    this.port = port;
    this.rooms = new Map();
    this.init();
  }

  init() {
    try {
      this.wss = new WebSocket.Server({ port: this.port });

      this.wss.on('connection', (ws) => {
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleMessage(ws, data);
          } catch (error) {
            console.error('Invalid message:', error);
          }
        });
      });

      console.log('Collaboration server running on port ' + this.port);
    } catch (error) {
      console.warn('Could not start collaboration server:', error.message);
    }
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'join':
        this.joinRoom(ws, data.room, data.user);
        break;
      case 'edit':
        this.broadcastEdit(ws, data);
        break;
      case 'cursor':
        this.broadcastCursor(ws, data);
        break;
    }
  }

  joinRoom(ws, roomId, user) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    ws.roomId = roomId;
    ws.user = user;
    this.rooms.get(roomId).add(ws);

    ws.send(JSON.stringify({ type: 'joined', room: roomId }));
  }

  broadcastEdit(sender, data) {
    const room = this.rooms.get(sender.roomId);
    if (room) {
      room.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }

  broadcastCursor(sender, data) {
    const room = this.rooms.get(sender.roomId);
    if (room) {
      room.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }
}

module.exports = CollaborationServer;