const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/send-otp',authController.sendOtp);
router.post('/verify-otp',authController.verifyOtp);

// protected route
router.put('/update-profile',authMiddleware,authController.updateProfile)




module.exports= router;