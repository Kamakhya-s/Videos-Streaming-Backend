import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/apiResponse.js"



const registerUser= asyncHandler(async (req,res) => {
   const {fullName,email,username,password}=req.body;
   //console.log({fullName,email,username,password});
   
   // get user details from frontend 
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creatoin 
    // return res


   if(
    [fullName,email,username,password].some((field)=> field?.trim() === "")
   ){
    throw new ApiError(400,"all fields are required")
   }
   
  const existedUser=await User.findOne({
    $or:[{ username },{ email }]
   })

   if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
   }
   if (!email.includes("@") || !email.includes(".")) {
    throw new ApiError(400, "Invalid email form at");
  }

  const avatarLocalPath=  req.files?.avatar[0]?.path;
  
  //console.log(req.files); 
// const coverImageLocalPath =  req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

  if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is required")
  }

const avatar= await uploadOnCloudinary(avatarLocalPath);
const coverImage=await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,"Avatar file is required")
}

const user=await User.create({
    username:username.toLowerCase(),
    avatar:avatar.url ,
    coverImage:coverImage?.url || null,
    email,
    fullName,
    password
})

const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully !!")
)
})

export  {registerUser}