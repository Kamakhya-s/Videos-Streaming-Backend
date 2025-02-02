import { Schema } from "mongoose";
import mongoose from "mongoose";

const tweetSchema= new Schema({
    owner:{
         type: Schema.Types.ObjectId,
        ref: "User"
    },
    content:{
        type:String,
        required:[true,"content is required"]
    }
},
{
    timestamps:true
})

export const Tweet= mongoose.model("Tweet",tweetSchema)