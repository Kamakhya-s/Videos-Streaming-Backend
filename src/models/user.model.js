import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: [true,"username is required"],
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
        required:  [true, 'email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required:[true,"fullname is required"],
        lowercase: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: {
            public_id: String,
            url: String 
        },
        required: true,
    },
    coverImage: {
        type: {
            public_id: String,
            url: String
        },
    },
    password: {
        type: String,
        required: [true, "password is required"],

    },
    refreshToken: {
        type: String
    },
}, { timestamps: true })

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect=async function (newPassword) {
  return await  bcrypt.compare(newPassword,this.password)
}

userSchema.methods.generateAccessToken=async function () {
return jwt.sign({
    _id:this._id,
    email:this.email,
    username:this.username,
    fullName:this.fullName
 },process.env.ACCESS_TOKEN_SECRET,
{
    expiresIn:process.env.ACCESS_TOKEN_EXPIRY
})   
}

userSchema.methods.generateRefreshToken=async function () {
    return jwt.sign({
        _id:this._id,
     },
     process.env.REFRESH_TOKEN_SECRET,
     {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })   
}
export const User = mongoose.model("User", userSchema) 