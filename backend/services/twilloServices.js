const { model } = require('mongoose');
const twillo = require('twilio');

const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN; 
const serviceSid = process.env.TWILLO_SERVICE_SID;

const client = twillo(accountSid,authToken);

// send otp to phone
const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    console.log('sending otp to this number', phoneNumber);
    if (!phoneNumber) {
      throw new Error('phone number is required');
    }
    const response = await client.verify.v2.services(serviceSid).verifications.create({
      to: phoneNumber,
      channel: 'sms',
    });
    console.log('this is my otp response', response);
    return response;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to send otp');
  }
};

const verifyOtp = async (phoneNumber,otp) => {
  try {
    console.log('this is my otp ', otp);
    console.log(' this number', phoneNumber);
    if (!phoneNumber) {
      throw new Error('phone number is required');
    }
    const response = await client.verify.v2.services(serviceSid).verificationsChecks.create({
      to: phoneNumber,
      code: otp,
    });
    console.log('this is my otp response', response);
    return response;
  } catch (error) {
    console.error(error);
    throw new Error('otp verification Failed');
  }
};

module.exports = {
    sendOtpToPhoneNumber,
    verifyOtp
};