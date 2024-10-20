//upload video
//add title
//views
//watchlist add video


import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import {Video} from "../models/video.model.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const uploadVideo=asyncHandler(async (req,res)=>{
    const videoLocalPath= req.file?.path
    console.log(videoLocalPath);
    
    if(!videoLocalPath)
    {
        throw new ApiError(400,"video is missing")
    }
})




export {
    uploadVideo
}