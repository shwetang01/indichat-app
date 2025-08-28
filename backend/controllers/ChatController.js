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
        if(file.mimetype.startwith('image')){
            contentType="image"
        }else  if(file.mimetype.startwith('video')){
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
        receive:receiverId,
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