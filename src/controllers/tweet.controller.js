import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
        //TODO: create tweet
        const {content} = req.body;
        if(!content ){
            throw new ApiError(400,"content is required")
        }
        
        const tweet = await Tweet.create({
        owner: req.user._id,
        content:content
        })
     
        if(!tweet){
            throw new ApiError(400,"something went wrong while saving tweet")
        }

        return res.status(200, tweet, "Tweet created successfully")
})

const getUserTweets = asyncHandler(async (req, res) => {
        // TODO: get user tweets
         return res.status(200,content,"Tweet send successfully")
})

const updateTweet = asyncHandler(async (req, res) => {
        //TODO: update tweet
       const {userId}= req.params;
       const existedTweet = await mongoose.aggregate([
        {
        
            $match:{owner:new mongoose.Types.ObjectId(userId)}
        
       },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline: [
                    {
                      $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1,
                      },
                    },
                  ],
            }
        }])


        res.status(200)
        .json(new ApiResponse(200,existedTweet,"Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {content}= req.body;
    const deletedTweet = await Tweet.findOneAndDelete(
        {content:content}
    )
    if(!deletedTweet){
        throw new ApiError(505,"Error in deleting tweet")
    }

    res.status(200)
    .json(new ApiResponse(200,deleteTweet,"Deleted tweet successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}