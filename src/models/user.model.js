import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
        trim: true
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    ],

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, //clodinary url
        required: true,
    },
    coverImage: {
        type: String,

    },
    password: {
        type: String,
        required: [true, "password is required"],

    },
    refreshToken: {
        type: String,

    },
}, { timestamps: true })

userSchema.pre("save",function(next){
    if(!this.isModified("password")) return next();

    this.password=bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect=async function (password) {
  return await  bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=async function (params) {
return jwt.sign({
    _id:this._id,
    email:this.email,
    username:this.username,
    fullName:this.fullName
 },process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY})   
}

userSchema.methods.generateRefreshToken=async function (params) {
    return jwt.sign({
        _id:this._id
     },
     process.env.REFRESH_TOKEN_SECRET,
     {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })   
}
export const User = mongoose.model("User", userSchema)