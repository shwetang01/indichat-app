const crypto = require('crypto');

const otpGenerate =()=>{
    return crypto.randomInt(100000, 1000000).toString();
}


module.exports = otpGenerate;