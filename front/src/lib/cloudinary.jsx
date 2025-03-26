import { Cloudinary } from '@cloudinary/url-gen';

// Initialize Cloudinary with your cloud name
export const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }
});

export const CloudinaryImage = ({ publicId, alt, className, ...props }) => {
  return <>Image</>
};

// React component for responsive Cloudinary images
export const ResponsiveCloudinaryImage = ({ publicId, width, alt, className, ...props }) => {
  return <>Image</>
}; 