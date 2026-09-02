const handleVideoCallEvent = (socket, io, onlineUsers) => {

    // initiating video call
    socket.on("initiate_call", ({ callerId, receiverId, callType, callerInfo }) => {
        const recId = receiverId ? receiverId.toString() : null;
        const receiverSocketId = recId ? onlineUsers.get(recId) : null;

        if (receiverSocketId) {
            const callId = `${callerId}-${recId}-${Date.now()}`;

            io.to(receiverSocketId).emit("incoming_call", {
                callerId: callerId ? callerId.toString() : null,
                callerName: callerInfo?.username,
                callerAvatar: callerInfo?.profilePicture,
                callId,
                callType,
            });
        } else {
            console.log(`server: Receiver ${recId} is offline or not found in onlineUsers`);
            socket.emit("call_failed", { reason: "user is offline" });
        }
    });

    // accept call
    socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
        const cId = callerId ? callerId.toString() : null;
        const callerSocketId = cId ? onlineUsers.get(cId) : null;

        if (callerSocketId) {
            io.to(callerSocketId).emit("call_accepted", {
                callerName: receiverInfo?.username,
                callerAvatar: receiverInfo?.profilePicture,
                callId
            });
        } else {
            console.log(`server: caller ${cId} not found`);
        }
    });

    // reject call
    socket.on("reject_call", ({ callerId, callId }) => {
        const cId = callerId ? callerId.toString() : null;
        const callerSocketId = cId ? onlineUsers.get(cId) : null;

        if (callerSocketId) {
            io.to(callerSocketId).emit("call_rejected", { callId });
        }
    });

    // end call
    socket.on("end_call", ({ participantId, callId }) => {
        const pId = participantId ? participantId.toString() : null;
        const participantSocketId = pId ? onlineUsers.get(pId) : null;

        if (participantSocketId) {
            io.to(participantSocketId).emit("call_ended", { callId });
        }
    });

    // WebRTC signaling - offer
    socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
        const recId = receiverId ? receiverId.toString() : null;
        const receiverSocketId = recId ? onlineUsers.get(recId) : null;

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_offer", {
                offer,
                senderId: (socket.userId || socket.id)?.toString(),
                callId
            });
            console.log(`server: offer forwarded to ${recId}`);
        } else {
            console.log(`server: Receiver ${recId} not found for the offer`);
        }
    });

    // WebRTC signaling - answer
    socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
        const recId = receiverId ? receiverId.toString() : null;
        const receiverSocketId = recId ? onlineUsers.get(recId) : null;

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_answer", {
                answer,
                senderId: (socket.userId || socket.id)?.toString(),
                callId
            });
            console.log(`server: answer forwarded to ${recId}`);
        } else {
            console.log(`server: Receiver ${recId} not found for the answer`);
        }
    });

    // WebRTC (ICE candidate) signaling with userid
    socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
        const recId = receiverId ? receiverId.toString() : null;
        const receiverSocketId = recId ? onlineUsers.get(recId) : null;

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_ice_candidate", {
                candidate,
                senderId: (socket.userId || socket.id)?.toString(),
                callId,
            });
        } else {
            console.log(`server: Receiver ${recId} not found for the ICE candidate`);
        }
    });

};

module.exports = handleVideoCallEvent;
