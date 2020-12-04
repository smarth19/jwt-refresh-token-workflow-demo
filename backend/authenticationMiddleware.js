require('dotenv').config()
const jwt = require('jsonwebtoken')

const authenticate = (req, res, next) => {
    const accessToken = req.cookies.authentication
    try {
        const { id } = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        req.userId = id
        return next()
    } catch (error) {
        res.send({
            error: 'ERROR'
        })
    }    
}
module.exports = authenticate