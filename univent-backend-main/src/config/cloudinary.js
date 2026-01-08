const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: 'dcbezix37',
    api_key: '163575242439853',
    api_secret: '69_KSMHq8ta7b0RtNSd0gXqz7rs',
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'univent_events', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
