const jwt = require('jsonwebtoken')
const SECRETE_KEY = process.env.SECRETE_KEY

const userAuthentication = (req, res, next) => {
    console.log('auth')
    let jwtToken;
    const authHeader = req.header('Authorization');
    
    if (authHeader !== undefined) {
        jwtToken = authHeader.replace('Bearer ', '');
    }
    if (jwtToken === undefined) {
        res.status(401);
        res.send("Invalid JWT Token");
    } else {
        jwt.verify(jwtToken, SECRETE_KEY, async (error, payload) => {
            if (error) {
                res.status(401);
                res.send("Invalid JWT Token");
            } else {
                
                req.role = payload.user.role 
                req.idUser = payload.user._id 
               
                next()
            }
        });
    }
};

module.exports = {userAuthentication}