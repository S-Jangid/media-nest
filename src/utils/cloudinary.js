import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadFileToCloudinary = async(tempFilePath) => {

    try {
        if(! tempFilePath) return null;
        
        const response = await cloudinary.uploader.upload(tempFilePath, {
            resource_type: auto
        })

        console.log("File uploaded successfully", response.url);

    } catch (error) {
        fs.unlinkSync(tempFilePath);
        return null;
    }
}



export {uploadFileToCloudinary};