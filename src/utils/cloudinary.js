import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if (!localFilePath)return null;
        //upload file on cloudinary
        const response= await  cloudinary.uploader.upload(localFilePath,{ 
            resource_type:"auto"
        })
        //uploaded file
        console.log("File uploaded :",response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) //fail in upload, hence delete file from server
        return null
    }
}
   
    export {uploadOnCloudinary}
    