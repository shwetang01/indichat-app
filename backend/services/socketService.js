const {Server} = require('socket.io');
const Message = require("../models/Message");
const { on } = require('../models/user');



const onlineUsers = new Map();

// map to track the typing status-> userid ->[conversation]:boolean
const typingUsers = new Map();

const initializeSocket = (server)=>{
    const io = new Server(server,{
        cors:{
            origin:process.env.FRONTEND_URL,
            credentials:true,
            methods:['GET','POST','PUT','DELETE','OPTIONS'],

        },
        pingTimeout: 60000,  //disconnect inactib=ve users or sockrt after 1 min= 60 seconds

    });

    // when  new socket connectrion is established
    io.on("connection",(socket)=>{
        console.log(`User connected :${socket.id}`)
        let userId = null;

        // handle user connection and marks them online in db

        socket.on("user_connected",async(connectingUserId)=>{
            try {
                userId = connectingUserId
                onlineUsers.set(userId,socket.id);
                socket.join(userId)   // join a prsonal room for direct emits
                
                // update use status in db 
                await User.findByIdAndUpdate(userId,{
                    isOnline :true,
                    lastSeen: new Date(),
                });

                // notify all users that this user is online
                io.emit("user_status",{userId,isOnline:true});



            } catch (error) {
                console.error("Error handling user connection",error)

            }

        });

        // return online status of requeted user

        socket.on("get_user_status",(requestedUserId,callback)=>{
            const isOnline = onlineUsers.has(requestedUserId)
            callback({
                userId:requestedUserId,
                isOnline,
                lastSeen: isOnline? new Date() :null,
            })

        })

        // froward message to receiver if online
        socket.on("send_message",async(message)=>{
            try { 
                const receiverSocketId = onlineUsers.get(message.receiver?._id);
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("receive_messages",message)
                }

            } catch (error) {
                console.error("Error sending messages",error)
                socket.emit("sessage_error",{error:"Failed to send message"})
 
            }
        })

        // update messages as read and notify the sender
        socket.on("message_read",async({messageIds,senderId})=>{
            try {
                await Message.updateMany(
                    {_id:{$in:messageIds}},
                    {$set: {messageStatus:"read"}}

                )
                const senderSocketId = onlineUsers.get(senderId);
                if(senderSocketId){
                    messageIds.forEach((messageId)=>{
                        io.to(senderSocketId).emit("message_status_update",{
                            messageId,
                            messageStatus: "read"
                        })
                    })
                }

            } catch (error) {
                console.error('Error updating message read status',error)
                
            }
        })
        // handle typing start eventv and auto-stop after 3 sec
         socket.on("typing_start",({conversationId,receiverId})=>{
            if(!userId || !conversationId || !receiverId) return;

            if(!typingUsers.has(userId)) typingUsers.set(userId,{});
            const userTyping = typingUsers.get(userId)

            userTyping[conversationId]= true;

            // clear any exiting timeout
            if(userTyping[`${conversationId}_timeout`]){
                clearTimeout(userTyping[`${conversationId}_timeout`])
            }

            // auto stop after 3 sec
            userTyping[`${conversationId}_timeout`]= setTimeout(()=>{
                userTyping[conversationId] = false;
                socket.to(receiverId).emit("user_typing",{
                    userId,
                    conversationId,
                    isTyping : false
                })
            },3000)

            // notify sreceiver 
            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping :true
            })




         })

         socket.on("typing_stop",({connectingUserId,receiverId})=>{
             if(!userId || !conversationId || !receiverId) return;

            if(!typingUsers.has(userId)) {
                const userTyping = typingUsers.get(userId);
                userTyping[conversationId] = false;
               
                if( userTyping[`${conversationId}_timeout`]){
                   clearTimeout( userTyping[`${conversationId}_timeout`])
                   delete userTyping[`${conversationId}_timeout`] 

                }

            };

            socket.to(receiverId).emit("user_typing",{
                userId,
                conversationId,
                isTyping:false
            })


         })

        //  add or update reaction on message

        

    });




}