require('dotenv').config()

const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const cookieParser = require('cookie-parser')
// Users
const users = require('./users')
// todos
const todos = require('./todos')
// authentication Middleware
const authentication = require('./authenticationMiddleware')
// this array contains all refresh tokens assigned to different users signed in to our website (generally they will be stored in a database like mongoDB)
let refreshTokens = []

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({origin: 'http://localhost:3000', credentials: true}))
app.use(cookieParser())

// logging in user and returning both the tokens
app.post('/login', (req, res) => {
    const {user} = req.body
    const isUser = users.find(e => e.name === user)
    console.log(isUser)
    if(!isUser) return res.send({error: 'Not a user'})
    // access token valid for 15 seconds
    const accessToken = jwt.sign({id: isUser.id}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: 15
    })
    // refresh token to be valid for 30 seconds(generally it is a long lived token but for the sake of testing kept it valid for only 30 seconds)
    const refreshToken = jwt.sign({id: isUser.id}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: 30
    })
    // Adding/Pushing this refresh token ton the array which contains all the issued refresh tokens
    refreshTokens.push(refreshToken)
    // saving access token as http only cookie on client computer whereas sending refresh token as normal return data which will be saved in local storage on client computer (although I am sceptical about it that whether should I save both token as http only cookie but doing this both tokens will be sent back to server on every protected route request and also at this point I have no idea that how will I set two http only cookie because below .cookie method receives only one name, value pair as of my knowledge)
    res.status(202).cookie('authentication', accessToken, {httpOnly: true, path: '/', expires: new Date(Date.now() + 15000)}).send({
        alert: 'Login Success',
        refreshToken
    })
})

// fetching todo of the user id stored in jwt payload(the user who looged in)
app.get('/fetchtodos', authentication, (req, res)=>{
    const id = req.userId
    const ToDos = todos.filter(e => e.byId === id)
    console.log(ToDos)
    res.send({ToDos})
})

// refreshing access token if the access token is expired
app.post('/refresh', (req, res) => {
    const authHeader = req.headers['x-auth-token']
    // separating bearer and token
    const refreshToken = authHeader.split(' ')[1]
    // checking if the refresh token was assigned to any user
    const isAssigned = refreshTokens.find(e => e === refreshToken)
    if(!isAssigned){
        return res.send({
        error: 'LOGIN_AGAIN',
        alert: 'Please Login'
    })}
    try {
        const {id} = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const newAccessToken = jwt.sign({id}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: 15*1000
        })
        // sending back newly generated access token back to client as http only cookie
        res.status(200).cookie('authentication', newAccessToken, {maxAge: 15*1000, httpOnly: true, sameSite: 'strict'}).send({
            alert: 'TOKEN REFRESHED'            
        })
    } catch (error) {
        console.log(error)
        // if the refresh token is expired then filtering it out of the assigned refresh tokens array
        const filterRefreshTokens = refreshTokens.filter(e => e != refreshToken)
        refreshTokens = filterRefreshTokens
        res.send({
            error: 'LOGIN_AGAIN',
            alert: 'Please Login'
        })
    }
})

app.listen(4000, ()=>console.log('server is running'))