import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadFileToCloudinary = async(tempFilePath) => {

    try {
        if(! tempFilePath) return null;
        console.log(tempFilePath);
        const response = await cloudinary.uploader.upload(tempFilePath, {
            resource_type: "auto"
        })

        fs.unlinkSync(tempFilePath)
        return response;

    } catch (error) {
        await fs.unlinkSync(tempFilePath);
        return null;
    }
}



export {uploadFileToCloudinary};