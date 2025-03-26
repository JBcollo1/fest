// to be used in events location field. google maps embed = 0$ monthly. requires billing info.

const GoogleMapEmbed = ({ location, className = '' }) => {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(location)}`;

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
};

export default GoogleMapEmbed; 


