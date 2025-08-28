const jwt = resquire('jsonwebtoken');

 const generateToken =(userId)=>{
    return jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:'1Y'
    })
 }

 module.exports=generateToken;