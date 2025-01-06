import { v2 as cloudinary } from 'cloudinary';
import { rimraf } from 'rimraf';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if (!localFilePath)return null;
        //upload file on cloudinary
        
        const response= await  cloudinary.uploader.upload(localFilePath,{ 
            resource_type:"auto"
        })

        //uploaded file
       // console.log("File uploaded :",response.url);
     
      // fs.unlinkSync(localFilePath);
      rimraf.moveRemove(localFilePath);
        return response;

    } catch (error) {
        rimraf.moveRemove(localFilePath); //fail in upload, hence delete file from server
        return error;
    }
}


const deleteOnCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;

        //delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        });
    } catch (error) {
        console.log("delete on cloudinary failed", error);
        return error;
    }
};
   
    export {uploadOnCloudinary, deleteOnCloudinary}
    