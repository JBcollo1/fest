// to be used in events location field. google maps embed = 0$ monthly. requires billing info.

const GoogleMapEmbed = ({ location, className = '' }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  console.log('GoogleMapEmbed - Input location:', location);
  console.log('GoogleMapEmbed - API Key available:', !!apiKey);
  
  // Extract coordinates from Google Maps URL or location string
  const extractCoordinates = (locationData) => {
    try {
      // If it's a Google Maps URL
      if (locationData.startsWith('http')) {
        console.log('GoogleMapEmbed - Processing Google Maps URL');
        const match = locationData.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          const coords = {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
          };
          console.log('GoogleMapEmbed - Extracted coordinates:', coords);
          return coords;
        }
        console.log('GoogleMapEmbed - No coordinates found in URL');
      } else {
        console.log('GoogleMapEmbed - Processing plain location string');
      }
      
      return null;
    } catch (error) {
      console.error('GoogleMapEmbed - Error extracting coordinates:', error);
      return null;
    }
  };

  // Extract place name from Google Maps URL or use location string
  const extractPlaceName = (locationData) => {
    try {
      if (locationData.startsWith('http')) {
        console.log('GoogleMapEmbed - Extracting place name from URL');
        const match = locationData.match(/\/place\/([^\/@]+)/);
        if (match) {
          const placeName = decodeURIComponent(match[1].replace(/\+/g, ' '));
          console.log('GoogleMapEmbed - Extracted place name:', placeName);
          return placeName;
        }
      }
      console.log('GoogleMapEmbed - Using original location as place name:', locationData);
      return locationData;
    } catch (error) {
      console.error('GoogleMapEmbed - Error extracting place name:', error);
      return locationData;
    }
  };

  // If API key is available, use the embed API
  if (apiKey) {
    const coords = extractCoordinates(location);
    if (coords) {
      const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${coords.lat},${coords.lng}&zoom=16`;
      console.log('GoogleMapEmbed - Using API with coordinates:', mapUrl);
      
      return (
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={className}
        />
      );
    }
  }
  
  // Fallback to iframe share format
  const coords = extractCoordinates(location);
  if (coords) {
    const mapUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=en&z=14&output=embed`;
    console.log('GoogleMapEmbed - Using iframe share with coordinates:', mapUrl);
    
    return (
      <div className={`relative ${className}`}>
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
      </div>
    );
  }

  // If no coordinates found, fall back to place search
  const placeName = extractPlaceName(location);
  const searchUrl = `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&hl=en&z=14&output=embed`;
  console.log('GoogleMapEmbed - Using place search fallback:', searchUrl);
  
  return (
    <div className={`relative ${className}`}>
      <iframe
        src={searchUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/5"></div>
      </div>
    </div>
  );
};

export default GoogleMapEmbed; 


