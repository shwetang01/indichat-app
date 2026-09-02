const otpGenerate = require("../utils/otpGenerator");
const User = require("../models/User");
const sendOtpToEmail = require("../services/emailService");
const response = require("../utils/responseHandler");
const twilloService = require('../services/twilloServices');
const generateToken = require("../utils/generateToken");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Step 1: Send OTP
const sendOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body;
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    let user;

    try {
        if (email) {
            user = await User.findOne({ email });
            if (!user) {
                user = new User({ email });
            }

            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();

           const result = await sendOtpToEmail(email, otp);

            if (!result.success) {
                console.error("Failed to send OTP via email:", result.error);
                return response(res, 500, "Failed to send OTP email. Please try again later.");
            }


            return response(res, 200, 'OTP sent to your email', { email });
        }

        if (!phoneNumber || !phoneSuffix) {
            return response(res, 400, 'Phone number and country code are required');
        }

        const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({ phoneNumber });
        if (!user) {
            user = new User({ phoneNumber, phoneSuffix });
        }

        await twilloService.sendOtpToPhoneNumber(fullPhoneNumber);
        await user.save();

        return response(res, 200, "OTP sent successfully to your phone", { phoneNumber: fullPhoneNumber });

    } catch (error) {
        console.error(error);
        return response(res, 500, 'Internal server error');
    }
};

// Step 2: Verify OTP
const verifyOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email, otp } = req.body;

    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
            if (!user) {
                return response(res, 404, 'User not found');
            }

            const now = new Date();
            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || now > new Date(user.emailOtpExpiry)) {
                return response(res, 400, 'Invalid or expired OTP');
            }

            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        } else {
            if (!phoneNumber || !phoneSuffix) {
                return response(res, 400, 'Phone number and country code are required');
            }

            const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
            user = await User.findOne({ phoneNumber });

            if (!user) {
                return response(res, 404, 'User not found');
            }

            const result = await twilloService.verifyOtp(fullPhoneNumber, otp);
            if (result.status !== 'approved') {
                return response(res, 400, 'Invalid OTP');
            }

            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user?._id);
        res.cookie("auth_token", token, {
            httpOnly: true,
            maxAge: 1000 * 365 * 24 * 60 * 60, // 1 year
        });

        return response(res, 200, 'OTP verified successfully', { token, user });

    } catch (error) {
        console.error(error);
        return response(res, 500, 'Internal server error');
    }
};

// Update Profile
const updateProfile = async (req, res) => {
    const { username, agreed, about } = req.body;
    const userId = req.user.userId;

    try {
        const user = await User.findById(userId);
        const file = req.file;

        if (file) {
            const uploadResult = await uploadFileToCloudinary(file);
            console.log(uploadResult);
            user.profilePicture = uploadResult?.secure_url;
        } else if (req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }

        if (username) user.username = username;
        if (agreed) user.agreed = agreed;
        if (about) user.about = about;

        await user.save();

        return response(res, 200, 'User profile updated successfully', user);

    } catch (error) {
        console.error(error);
        return response(res, 500, 'Internal server error');
    }
};

// Check if authenticated
const checkAuthentication = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return response(res, 401, 'Unauthorized! Please log in to access this resource');
        }

        const user = await User.findById(userId);
        if (!user) {
            return response(res, 404, 'User not found');
        }

        return response(res, 200, 'User authenticated successfully', user);

    } catch (error) {
        console.error(error);
        return response(res, 500, 'Internal server error');
    }
};

// Logout
const logout = (req, res) => {
    try {
        res.cookie("auth_token", "", { expires: new Date(0) });
        return response(res, 200, 'User logged out successfully');
    } catch (error) {
        console.error(error);
        return response(res, 500, 'Internal server error');
    }
};

// Get all users except self
const getAllUsers = async (req, res) => {
    const loggedInUser = req.user.userId;

    try {
        const users = await User.find({ _id: { $ne: loggedInUser } })
            .select("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix")
            .lean();

        const usersWithConversation = await Promise.all(
            users.map(async (user) => {
                const conversation = await Conversation.findOne({
                    participants: { $all: [loggedInUser, user?._id] }
                }).populate({
                    path: "lastMessage",
                    select: 'content createdAt sender receiver messageStatus imageOrVideoUrl contentType'
                }).lean();

                if (conversation) {
                    const unreadCount = await Message.countDocuments({
                        conversation: conversation._id,
                        receiver: loggedInUser,
                        messageStatus: { $in: ["send", "delivered"] }
                    });
                    conversation.unreadCount = unreadCount;
                }

                return {
                    ...user,
                    conversation: conversation || null
                };
            })
        );

        // Sort: newest message first, followed by contacts without messages
        usersWithConversation.sort((a, b) => {
            const aTime = a.conversation?.lastMessage?.createdAt
                ? new Date(a.conversation.lastMessage.createdAt).getTime()
                : a.conversation?.updatedAt
                ? new Date(a.conversation.updatedAt).getTime()
                : 0;
            const bTime = b.conversation?.lastMessage?.createdAt
                ? new Date(b.conversation.lastMessage.createdAt).getTime()
                : b.conversation?.updatedAt
                ? new Date(b.conversation.updatedAt).getTime()
                : 0;
            return bTime - aTime;
        });

        return response(res, 200, 'Users retrieved successfully', usersWithConversation);

    } catch (error) {
        console.error(error);
        return response(res, 500, 'Internal server error');
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    updateProfile,
    logout,
    checkAuthentication,
    getAllUsers
};
