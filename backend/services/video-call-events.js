const handleVideoCallEvent = (socket, io, onlineUsers) => {

    // initiating video call
    socket.on("initiate_call", ({ callerId, receiverId, callType, callerInfo }) => {

        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
            const callId = `${callerId}-${receiverId}-${Date.now()}`;

            io.to(receiverSocketId).emit("incoming_call", {
                callerId,
                callerName: callerInfo.username,
                callerAvatar: callerInfo.profilePicture,
                callId,
                callType,
            });
        } else {
            console.log(`server: Receiver ${receiverId} is offline`);
            socket.emit("call_failed", { reason: "user is offline" });
        }
    });

    // accept call
    socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
        const callerSocketId = onlineUsers.get(callerId);

        if (callerSocketId) {
            io.to(callerSocketId).emit("call_accepted", {
                callerName: receiverInfo.username,
                callerAvatar: receiverInfo.profilePicture,
                callId
            });
        } else {
            console.log(`server: caller ${callerId} not found`);
        }
    });

    // reject call
    socket.on("reject_call", ({ callerId, callId }) => {
        const callerSocketId = onlineUsers.get(callerId);

        if (callerSocketId) {
            io.to(callerSocketId).emit("call_rejected", { callId });
        }
    });

    // end call
    socket.on("end_call", ({ participantId, callId }) => {
        const participantSocketId = onlineUsers.get(participantId);

        if (participantSocketId) {
            io.to(participantSocketId).emit("call_ended", { callId });
        }
    });

    // WebRTC signaling - offer
    socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_offer", {
                offer,
                senderId: socket.userId,
                callId
            });
            console.log(`server: offer forwarded to ${receiverId}`);
        } else {
            console.log(`server: Receiver ${receiverId} not found for the offer`);
        }
    });

    // WebRTC signaling - answer
    socket.on("webrtc_answer", ({ offer, receiverId, callId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_answer", {
                offer,
                senderId: socket.userId,
                callId
            });
            console.log(`server answer forwarded to ${receiverId}`);
        } else {
            console.log(`server: Receiver ${receiverId} not found for the answer`);
        }
    });

    // WebRTC (ICE candidate) signaling with userid
    socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);

        console.log("connecting ice candidate")

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_ice_candidate", {
                candidate,
                senderId: socket.userId,
                callId,
            });
        } else {
            console.log(`server: Receiver ${receiverId} not found for the ICE candidate`);
        }
    });

};

module.exports = handleVideoCallEvent;
