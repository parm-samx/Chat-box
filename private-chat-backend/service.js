const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
let connectedUsers = 0;
let messages = [];

if (fs.existsSync("messages.json")) {
  messages = JSON.parse(fs.readFileSync("messages.json"));
}

io.on("connection", (socket) => {
  if (connectedUsers >= 2) {
    socket.emit("room_full");
    socket.disconnect();
    return;
  }
  connectedUsers++;

  socket.emit("chat_history", messages);

  socket.on("chat_message", (msg) => {
    const messageObj = { text: msg, time: new Date().toLocaleTimeString() };
    messages.push(messageObj);
    fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));
    io.emit("chat_message", messageObj);
  });

  socket.on("clear_chat", () => {
    messages = [];
    fs.writeFileSync("messages.json", JSON.stringify(messages));
    io.emit("chat_cleared");
  });

  socket.on("disconnect", () => {
    connectedUsers--;
  });
});

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
