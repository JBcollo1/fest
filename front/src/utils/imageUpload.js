import axios from 'axios';

export const uploadImage = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add query parameters for private/public and target
    const params = new URLSearchParams();
    if (options.isPrivate !== undefined) {
      params.append('private', options.isPrivate);
    }
    if (options.target) {
      params.append('target', options.target);
    }

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/images?${params.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );

    return {
      url: response.data.image_url,
      public_id: response.data.public_id,
      is_private: response.data.is_private,
      expires_at: response.data.expires_at
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const getImageUrl = async (publicId, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.isPrivate !== undefined) {
      params.append('private', options.isPrivate);
    }
    if (options.format) {
      params.append('format', options.format);
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/images/${publicId}?${params.toString()}`,
      {
        withCredentials: true,
      }
    );

    return {
      url: response.data.url,
      expires_at: response.data.expires_at
    };
  } catch (error) {
    console.error('Error getting image URL:', error);
    throw error;
  }
}; 