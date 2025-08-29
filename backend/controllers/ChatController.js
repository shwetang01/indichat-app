const Conversation = require("../models/Conversation");
const response = require('../utils/responseHandler');
const {uploadFileToCloudinary} = require('../config/cloudinaryConfig');
// const message = require('../models/Message');
const Message = require("../models/Message");
const { Receive } = require("twilio/lib/twiml/FaxResponse");

exports.sendMessage = async(req,res) =>{
try {
    const {senderId,receiverId,content,messageStatus} =  req.body;
    const file = req.file;

    const participants = [senderId,receiverId].sort();
   
    // check if conversation alredy exist
    let conversation = await Conversation.findOne({
        participants:participants
    });
    
    if(!conversation){
        conversation= new Conversation({
            participants
        });
        await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // handle file upload
    if(file){
        const uploadFile = await uploadFileToCloudinary(file);

        if(!uploadFile?.secure_url){
            return response(res,400,"failed to upload media");
        };

        imageOrVideoUrl = uploadFile?.secure_url;
        if(file.mimetype.startswith('image')){
            contentType="image"
        }else  if(file.mimetype.startswith('video')){
            contentType="video"
        }else{
            return response(res,400,'Unsupported file type');
        }
    }else if(content?.trim()){
        contentType ="text";

    }else{
        return response(res,400,"message content is required");
    }
    
    const message= new Message({
        conversation:conversation?._id,
        sender:senderId,
        receiver:receiverId,
        content,
        contentType,
        imageOrVideoUrl,
        messageStatus

    });

    await message.save();

    if(message?.content){
      conversation.lastMessage = message?.id

    }
    conversation.unreadCount+=1;
    await conversation.save();

    const populatedMessage = await Message.findOne(message?._id)
    .populate("sender","username profilePicture")
    .populate("receiver","username profilePicture")

    return response(res,201,"Message send successfully",populatedMessage);


} catch (error) {
     console.error(error);
    return response(res,500,'Internal sarver error');
        
}


};

// get all converasation
exports.getConversation = async(req,res)=>{
    const userId = req.user.userId;
    try {
        let conversation = await Conversation.find({
        participants: userId,

    }).populate("participants","username profilePicture isOnline lastSeen")
    .populate({
        path:"lastMessage",
        populate:{
            path:"sender receiver",
            select :"username profilePicture"

        }
    }).sort({updatedAt :-1})
    return response(res,201,"Conversation get successful",conversation)
    } catch (error) {
        console.error(error);
        return response(res,500,'Internal sarver error');
    }
};

// get message of specific conversation 
exports.getMessages = async(req,res) =>{
    const {conversationId} =req.params;
    const userId = req.user.userId;
    try {
        const conversation = await Conversation.findById(conversationId);
        if(!conversation){
            return response(res,400,"conversation not found")
        };

        if(!conversation.participants.includes(userId)){
            return response(res,403,"not authorized to view this conversation")
        }

        const messages = await Message.find({conversation:conversationId})
        .populate("sender","username profilePicture")
        .populate("receiver","username profilePicture")
        .sort("createdAt");

        await Message.updateMany(
            {
                conversation:conversationId,
                receiver:userId,
                messageStatus:{$in :["send","delivered"]},
            },
            { $set:{messageStatus: "read"}  },
    
        );

        conversation.unreadCount = 0;
        await conversation.save();
        return response(res,200,"message retrived ",messages);              
        
    } catch (error) {
        console.error(error);
        return response(res,500,'Internal sarver error');
    }
}



// mark as read api
exports.markAsRead = async(req,res)=>{
    const {messageIds}= req.body;
    const userId = req.user.userId;

    try {
        // get relevant messages to detrmine senders
        let messages = await Message.find({
            _id:{$in :messageIds},
            receiver:userId,
        })
        
        await Message.updateMany(
            { _id: {$in :messageIds},receiver :userId},
            { $set: {messageStatus:"read"}}
            
        );

        return response(res,200,"Messages mark as read",messages)

    } catch (error) {
         console.error(error);
        return response(res,500,'Internal sarver error');
    }

}


// to delete a message 
exports.deleteMessage = async(req,res) =>{
    const {messageId}= req.body;
    const userId = req.user.userId;
    try {
        const message = await Message.findById(messageId);
        if(!message){
            return response(res,404 ,"Messages not found")

        };
        if(message.sender.toString() !==userId){
            return response(res,403,"not authorized to delete this message")
        }

        await message.deleteOne();

        return response(res,200,"Message deleted successfully")
        
    } catch (error) {
        console.error(error);
        return response(res,500,'Internal sarver error');
    }
};
