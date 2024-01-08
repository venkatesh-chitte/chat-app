const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create WebSocket server
const wss = new WebSocket.Server({ server });

const users = new Map();

wss.on('connection', (ws) => {
  let username;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'join') {
      username = data.username;
      const userKey = data.key;

      // Check the special key
      if (userKey === '1234') {
        users.set(username, ws);
        broadcastUserList();
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid key' }));
      }
    } else if (data.type === 'chat') {
      broadcastMessage(username, data.text);
    }
  });

  ws.on('close', () => {
    users.delete(username);
    broadcastUserList();
  });
});

function broadcastUserList() {
  const userList = Array.from(users.keys());
  const onlineUsers = Array.from(wss.clients).map((client) => {
    return {
      username: Array.from(users.values()).includes(client) ? 'green' : 'red',
    };
  });

  const payload = { type: 'userList', userList, onlineUsers };

  wss.clients.forEach((client) => {
    client.send(JSON.stringify(payload));
  });
}

function broadcastMessage(sender, text) {
  const payload = { type: 'chat', sender, text };

  wss.clients.forEach((client) => {
    client.send(JSON.stringify(payload));
  });
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
