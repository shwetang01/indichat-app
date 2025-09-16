


const handleVideoCallEvent = (socket,io,onlineUsers) =>{

    // initialing video call
    socket.io("initiate_call",({callerId,receiverId,callType,callerInfo})=>{

        const receiverSocketId = onlineUsers.get(receiverId);

        if(receiverSocketId) {
            const callId = `${callerId}-${receiverId}-${Date.now()}`;

            io.to(receiverSocketId).emit("incoming_call",{
                callerId,
                callerName:callerInfo.username,
                callerAvatar: callerInfo.profilePicture,
                callId,
                callType
            })
        }else{
            console.log(`server: Receiver ${receiverId} is offline`)
            socket.emit("call_failed",{reason:"user is offline"})

        }
    })

    // accept call
    socket.io("accept_call",({callerId,callId,receiverInfo})=>{

        const callerSocketId = onlineUsers.get(callerId);

        if(callerSocketId) {
           

            io.to(callerSocketId).emit("call_accepted",{
                
                callerName:receiverInfo.username,
                callerAvatar: receiverInfo.profilePicture,
                callId
                
            })
        }else{
            console.log(`server: caller ${callerId} not found`)
          

        }
    })    

    // reject call
     socket.io("reject_call",({callerId,callId})=>{

        const callerSocketId = onlineUsers.get(callerId);

        if(callerSocketId) {
         io.to(callerSocketId).emit("call_rejected",{ callId})
        }
    }) 
    
     // end call
     socket.io("end_call",({participantId,callId})=>{

        const participantSocketId = onlineUsers.get(participantId);

        if(participantSocketId) {
         io.to(participantSocketId).emit("call_ended",{ callId})
        }
    });
    
    
    // Webrtc signaling event with proper userId
    socket.on("webrtc_offer",({offer,receiverId,callId})=>{
        const receiverSocketId =onlineUsers.get(receiverId);

        if(receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_offer",{
                offer,
                senderId:socket.userId,
                callId
            })
            console.log(`server offer forwarded to ${receiverId}`)

        }else{
            console.log(`server: Receiver ${receiverId}not found the answer `)
        }
    })

    // Webrtc signaling event with proper userId
    socket.on("webrtc_answer",({offer,receiverId,callId})=>{
        const receiverSocketId =onlineUsers.get(receiverId);

        if(receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_answer",{
                offer,
                senderId:socket.userId,
                callId
            })
             console.log(`server answer forwarded to ${receiverId}`)
        }else{
           console.log(`server: Receiver ${receiverId}not found the answer`)

        }
    })

    // webrtc ice candidate
    socket.on("webrtc_ice_candidate",({candidate,receiverId,callId})=>{
        const receiverSocketId =onlineUsers.get(receiverId);

        if(receiverSocketId) {
            io.to(receiverSocketId).emit("webrtc_answer",{
                candidate,
                senderId:socket.userId,
                callId
            })
           
        }else{
           console.log(`server: Receiver ${receiverId}not found the ICE candidate`)

        }
    })



};


module.exports = handleVideoCallEvent;