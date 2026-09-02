const jwt = require("jsonwebtoken");
const response = require("../utils/responseHandler");

const socketMiddleware = (socket, next) => {
  let token =
    socket.handshake.auth?.token ||
    socket.handshake.headers["authorization"]?.split(" ")[1];

  if (!token && socket.handshake.headers.cookie) {
    const match = socket.handshake.headers.cookie.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    console.warn("Socket handshake: No authentication token found");
    return next();
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decode;
    socket.userId = decode.userId || decode.id;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next();
  }
};

module.exports = socketMiddleware;
