import { create } from "zustand";
import { getSocket, initializeSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";


export const useChatStore = create((set,get)=>({
    
    conversations :[],
    contacts: [],
    currentConversation : null,
    messages: [],
    loading:false,
    error:null,
    onlineUsers: new Map(),
    typingUsers: new Map(),

    setContacts: (contacts) => set({ contacts }),
    setCurrentConversation: (conversationId) => set({ currentConversation: conversationId }),

    updateContactOnMessage: (message) => {
        if (!message) return;
        const senderId = message.sender?._id || message.sender;
        const receiverId = message.receiver?._id || message.receiver;
        const currentUserId = get().currentUser?._id;
        const activeConversation = get().currentConversation;
        const isReceiver = String(receiverId) === String(currentUserId);

        set((state) => ({
            contacts: state.contacts.map((contact) => {
                const isMatch = String(contact._id) === String(senderId) || String(contact._id) === String(receiverId);
                if (!isMatch) return contact;

                const isCurrentActiveChat = activeConversation && (
                    String(message.conversation) === String(activeConversation) ||
                    String(contact.conversation?._id) === String(activeConversation)
                );

                const prevUnread = contact.conversation?.unreadCount || 0;
                const newUnread = (isReceiver && !isCurrentActiveChat)
                    ? prevUnread + 1
                    : (isCurrentActiveChat ? 0 : prevUnread);

                return {
                    ...contact,
                    conversation: {
                        ...(contact.conversation || {}),
                        _id: message.conversation || contact.conversation?._id,
                        lastMessage: message,
                        unreadCount: newUnread,
                        updatedAt: message.createdAt || new Date().toISOString()
                    }
                };
            })
        }));
    },

    resetUnreadCount: (conversationIdOrContactId) => {
        if (!conversationIdOrContactId) return;
        set((state) => ({
            contacts: state.contacts.map((contact) => {
                if (
                    String(contact._id) === String(conversationIdOrContactId) ||
                    String(contact.conversation?._id) === String(conversationIdOrContactId)
                ) {
                    return {
                        ...contact,
                        conversation: {
                            ...(contact.conversation || {}),
                            unreadCount: 0
                        }
                    };
                }
                return contact;
            })
        }));
    },


    // socket event listeners setup
    initsocketListeners : ()=> {
        const socket = getSocket();
        if(!socket) return ;

        // remove existing listeners to prevent duplicate handlers
        socket.off("receive_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("online_users_list");
        socket.off("send_message");
        socket.off("message_status_update");
        socket.off("reaction_update");
        socket.off("message_error");
        socket.off("message_deleted");

        // listen for list of all currently online users
        socket.on("online_users_list", (userIds) => {
            if (Array.isArray(userIds)) {
                set((state) => {
                    const newOnlineUsers = new Map(state.onlineUsers);
                    userIds.forEach((uid) => {
                        const prev = newOnlineUsers.get(uid.toString());
                        newOnlineUsers.set(uid.toString(), {
                            isOnline: true,
                            lastSeen: prev?.lastSeen || new Date()
                        });
                    });
                    return { onlineUsers: newOnlineUsers };
                });
            }
        });

        // listen for incoming messages
        socket.on("receive_message", (message) => {
            get().receiveMessage(message);
        });

        // confirm message delivery
        socket.on("send_message",(message) =>{
            set((state)=>({
                messages: state.messages.map((msg)=>
                msg._id === message._id?{...msg} :msg )
            }))
        });

        // update message status
        socket.on("message_status_update",({messageId,messageStatus})=>{
            set((state)=>({
               messages: state.messages.map((msg)=>
                msg._id === messageId ? {...msg,messageStatus} :msg )                
            }))
        });

        // handle reaction on mssg
         socket.on("reaction_update",({messageId,reactions})=>{
            set((state)=>({
               messages: state.messages.map((msg)=>
                msg._id === messageId ? {...msg,reactions} :msg )                
            }))
        });

        // remove message from local state
        socket.on("message_deleted",({deletedMessageId})=>{
            set((state) => ({
                messages: state.messages.filter((msg)=> msg._id !== deletedMessageId)
            }));
        });

        // handle any message sending error
        socket.on("message_error",(error)=>{
            console.error("message error",error)
        });

        // listener for typing users
        socket.on("user_typing",({userId,conversationId,isTyping})=>{
            set((state)=>{
                const newTypingUsers= new Map(state.typingUsers);
                if(!newTypingUsers.has(conversationId)){
                    newTypingUsers.set(conversationId,new Set())
                }
                const typingSet = newTypingUsers.get(conversationId);
                 if(isTyping){
                    typingSet.add(userId)
                }else{
                    typingSet.delete(userId)
                }
                return {typingUsers:newTypingUsers}
            })
        });

        // online-offline track
        socket.on("user_status",({userId,isOnline,lastSeen})=>{
            if(!userId) return;
            set((state)=>{
                const newOnlineUsers = new Map(state.onlineUsers);
                const prev = newOnlineUsers.get(userId.toString());
                newOnlineUsers.set(userId.toString(),{
                    isOnline: !!isOnline,
                    lastSeen: lastSeen || (isOnline ? new Date() : prev?.lastSeen || null)
                });
                return {onlineUsers:newOnlineUsers}
            })
        });

        // emit status check of all user in conversation list
        const {conversations} = get();
        if(conversations?.data?.length >0){
            conversations.data?.forEach((conv)=>{
                const otherUser = conv.participants.find(
                    (p)=> p._id !==get().currentUser?._id
                );

                if(otherUser?._id){
                    socket.emit("get_user_status",otherUser._id.toString(),(status)=>{
                        if (status?.userId) {
                            set((state)=>{
                                const newOnlineUsers = new Map(state.onlineUsers);
                                newOnlineUsers.set(status.userId.toString(),{
                                    isOnline: !!status.isOnline,
                                    lastSeen: status.lastSeen || null
                                });
                                return {onlineUsers: newOnlineUsers}
                            });
                        }
                    });
                }
            })
        }
    },

    setCurrentUser :(user)=> set({currentUser:user}),

    fetchConversations: async()=>{
        set({loading:true,error:null});
        try {
            const {data} = await axiosInstance.get("/chats/conversations");
            set({conversations:data,loading:false});
            get().initsocketListeners();
            return data;

        } catch (error) {
            set({
                error:error?.response?.data?.message || error?.message,
                loading:false
            });
            return null;
            
        }
    },

    // fetch message for a conversation
    fetchMessages: async(conversationId) =>{
        if(!conversationId) return;
        set({loading:true,error:null})
        try {
            const {data}= await axiosInstance.get(`/chats/conversations/${conversationId}/messages`);
            const messageArray = data.data || data || [];
            set({
                messages: messageArray,
                currentConversation:conversationId,
                loading:false
            });

            // reset unread count for this contact
            get().resetUnreadCount(conversationId);

            // mark unread as read
            const {markMessagesAsRead} = get();
            markMessagesAsRead();

            return messageArray;

        } catch (error) {
             set({
                error:error?.response?.data?.message || error?.message,
                loading:false
            });
            return [];
        }
    },

    // send msg in real time
    sendMessage :async (formData)=> {
        const senderId = formData.get("senderId");
        const receiverId = formData.get("receiverId");
        const media = formData.get("media");
        const content = formData.get("content");
        const messageStatus = formData.get("messageStatus");

        const socket = getSocket();

        const {conversations} = get();
        let conversationId = null;
        if(conversations?.data?.length >0) {
            const converasation = conversations.data.find((conv)=>
            conv.participants.some((p) => p._id === senderId)&&
            conv.participants.some((p)=>p._id === receiverId)

        );
        if(converasation){
            conversationId = converasation._id;
            set({currentConversation: conversationId})

        }

        }

        // temp message before actual response
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id:tempId,
            sender:{_id:senderId},
            receiver:{_id:receiverId},
            conversation: conversationId,
            imageOrVideoUrl: media && typeof media !=='string' ?URL.createObjectURL(media):null,
            content :content,
            contentType : media ?media.type.startsWith("image") ?"image" :"video":"text",
            createdAt: new Date().toISOString(),
            messageStatus,

        };
        set((state)=>({
            messages: [...state.messages,optimisticMessage]

        }));

        try {
            const {data} = await axiosInstance.post("/chats/send-message",formData,
               {headers :{"Content-Type":"multipart/form-data"}} 
            );

            const messageData = data.data ||data;

            // replace optimist with real
            set((state)=>({
                messages:state.messages.map((msg)=>
                msg._id === tempId ?messageData :msg )

            }));

            // update contact in list preview
            get().updateContactOnMessage(messageData);

            return messageData;

            
        } catch (error) {
            console.error("Error sending mesage",error);
            set((state)=>({
                messages: state.messages.map((msg)=>
                msg._id === tempId ? {...msg,messageStatus:"failed"}:msg),

                error:error?.response?.data?.message || error?.message,
            }))
            throw error;
            
        }
    },

    receiveMessage :(message)=>{
        if(!message) return;

        const {currentConversation,currentUser,messages} = get();
        const messageExist = messages.some((msg)=>msg._id === message._id)
        if(messageExist) return;
        
        const isForActiveConversation = currentConversation && (
            String(message.conversation) === String(currentConversation)
        );

        if(isForActiveConversation){
            set((state)=>({
                messages :[...state.messages,message]
            }));

            // automatically mark as read
            const receiverId = message.receiver?._id || message.receiver;
            if(String(receiverId) === String(currentUser?._id)){
                get().markMessagesAsRead();
            }
        }

        // update contacts list preview and unread count in real time
        get().updateContactOnMessage(message);

        // also update conversation preview and unread count
        set((state)=>{
            const updateConversations = state.conversations?.data?.map((conv)=>{
             if(String(conv._id) === String(message.conversation)){
                 const receiverId = message.receiver?._id || message.receiver;
                 const isForMe = String(receiverId) === String(currentUser?._id);
                 return{
                    ...conv,
                    lastMessage: message,
                    unreadCount: (isForMe && !isForActiveConversation)
                    ?(conv.unreadCount ||0) +1
                    :(isForActiveConversation ? 0 : (conv.unreadCount || 0))
                 }

             }
             return conv;
            });

            return {
                conversations :{
                    ...state.conversations,
                    data:updateConversations,
                },
            }
        })
    },

    // mark as read
    markMessagesAsRead :async ()=>{
        const {messages,currentUser}= get();

        if(!messages.length || !currentUser) return;
        const unreadIds = messages.filter((msg)=> msg.messageStatus !== 'read' && msg.receiver?._id === currentUser?._id).map((msg)=> msg._id).filter(Boolean);

        if(unreadIds.length === 0) return;

        try {
            const {data} = await axiosInstance.put("/chats/messages/read",{
                messageIds :unreadIds
            });

            console.log("message mark as read",data)

            set((state)=>({
                messages:state.messages.map((msg)=>
                unreadIds.includes(msg._id)?{...msg,messageStatus:"read"} :msg)

            }));

            const socket = getSocket();
            if(socket){
                socket.emit("message_read",{
                    messageIds: unreadIds,
                    senderId: messages[0]?.sender?._id
                })
            }



        } catch (error) {
            console.error("failed to marks message as read",error)
        }
        
    },

    // delete mssg
    deleteMessage : async(messageId)=>{
        try {
            await axiosInstance.delete(`/chats/messages/${messageId}`);

            set((state)=>({
                messages:state.messages?.filter((msg)=>msg?._id !== messageId)
            }))
            return true;
        } catch (error) {
            console.log("error deleting error",error)
            set ({error:error.response?.data?.message || error.message})
            return false;
        }

    },

    // add or change reaction
    addReaction: async(messageId,emoji) =>{
        const socket = getSocket();
        const {currentUser} = get();
        if(socket && currentUser){
            socket.emit("add_reaction",{
                messageId,
                emoji,
                userId: currentUser?._id
            })
        }
    },

    startTyping :(receiverId) =>{
        const {currentConversation} = get();
        const socket = getSocket();
        if(socket && currentConversation && receiverId){
            socket.emit("typing_start",{
                conversationId: currentConversation,
                receiverId
            })
        }
    },

     stopTyping :(receiverId) =>{
        const {currentConversation} = get();
        const socket = getSocket();
        if(socket && currentConversation && receiverId){
            socket.emit("typing_stop",{
                conversationId: currentConversation,
                receiverId
            })
        }
    },

    isUserTyping: (userId) =>{
        const {typingUsers,currentConversation}= get();
        if(!currentConversation || !typingUsers.has(currentConversation) || !userId){
            return false;
        }
        return typingUsers.get(currentConversation).has(userId)
    },

    isUserOnline: (userId) =>{
        if(!userId) return false;
        const {onlineUsers} = get();
        return onlineUsers.get(userId.toString())?.isOnline || false;
    },

    getUserLastSeen: (userId) =>{
        if(!userId) return null;
        const {onlineUsers} = get();
        return onlineUsers.get(userId.toString())?.lastSeen || null;
    },

    initUsersStatus: (users) => {
        if (!Array.isArray(users)) return;
        set((state) => {
            const newOnlineUsers = new Map(state.onlineUsers);
            users.forEach((u) => {
                if (u?._id) {
                    const uidStr = u._id.toString();
                    const existing = newOnlineUsers.get(uidStr);
                    newOnlineUsers.set(uidStr, {
                        isOnline: existing ? existing.isOnline : !!u.isOnline,
                        lastSeen: existing?.lastSeen || u.lastSeen || null
                    });
                }
            });
            return { onlineUsers: newOnlineUsers };
        });
    },

    checkUserStatus: (userId) => {
        if (!userId) return;
        const socket = getSocket();
        if (socket && socket.connected) {
            socket.emit("get_user_status", userId.toString(), (status) => {
                if (status?.userId) {
                    set((state) => {
                        const newOnlineUsers = new Map(state.onlineUsers);
                        newOnlineUsers.set(status.userId.toString(), {
                            isOnline: !!status.isOnline,
                            lastSeen: status.lastSeen || null
                        });
                        return { onlineUsers: newOnlineUsers };
                    });
                }
            });
        }
    },

    cleanup :()=>{
        set({
            conversations: [],
            contacts: [],
            currentConversation: null,
            messages: [],
            onlineUsers: new Map(),
            typingUsers: new Map(),
        });
    },


    



}));