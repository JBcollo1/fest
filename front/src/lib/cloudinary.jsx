import { Cloudinary } from '@cloudinary/url-gen';
import { AdvancedImage } from '@cloudinary/react';

export const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }
});

export const CloudinaryImage = ({ publicId, alt, className, ...props }) => {
  const image = cld.image(publicId);
  
  // default transformations
  image
    .quality('auto')
    .format('auto')
    .delivery('q_auto,f_auto');
    
  return (
    <AdvancedImage
      cldImg={image}
      alt={alt}
      className={className}
      {...props}
    />
  );
};

export const ResponsiveCloudinaryImage = ({ publicId, width, alt, className, ...props }) => {
  const image = cld.image(publicId);
  
  image
    .quality('auto')
    .format('auto')
    .resize('w_' + width)
    .delivery('q_auto,f_auto');
    
  return (
    <AdvancedImage
      cldImg={image}
      alt={alt}
      className={className}
      {...props}
    />
  );
}; 