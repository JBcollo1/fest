import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const EventCard = ({ 
  event = {
    id: '',
    title: '',
    image: '',
    start_datetime: new Date(),
    location: '',
    currency: '',
    price: 0,
    description: '',
    featured: false,
    total_tickets: 0,
    tickets_sold: 0,
    categories: [],
    organizer: null
  }, 
  featured = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format the date using the API's datetime format
  const formattedDate = new Date(event.start_datetime).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Calculate tickets available
  const ticketsAvailable = event.total_tickets - event.tickets_sold;

  return (
    <Link 
      to={`/event/${event.id}`}
      className={`block card-hover rounded-xl overflow-hidden ${
        featured ? 'relative md:col-span-2 md:row-span-2 h-full' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[260px]">
        <div 
          className={`w-full transition-transform duration-700 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          style={{ 
            backgroundImage: `url(${event.image || '/default-event-image.jpg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: featured ? '260px' : '260px'
          }}
        />
        {/* Show categories as badges */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {event.categories && event.categories.length > 0 ? (
            event.categories.map(category => (
              <Badge key={category.id} variant="secondary" className="font-medium">
                {category.name}
              </Badge>
            ))
          ) : null}
        </div>
        {event.featured && !featured && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="default" className="bg-primary font-medium">
              Featured
            </Badge>
          </div>
        )}
      </div>
      
      <div className={`p-3 ${featured ? 'glass absolute bottom-0 left-0 right-0' : 'bg-card'}`}>
        <div className="space-y-2">
          <h3 className={`font-display font-semibold ${featured ? 'text-xl md:text-2xl' : 'text-lg'}`}>
            {event.title}
          </h3>
          
          <div className="flex flex-wrap gap-y-2 text-sm">
            <div className="flex items-center mr-4">
              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center mr-4">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              {event.ticket_types && event.ticket_types.length > 0 ? (
                (() => {
                  // Find the minimum price among ticket types
                  const minPrice = Math.min(...event.ticket_types.map(type => type.price || 0));
                  return minPrice > 0 ? (
                    <span>{event.currency} {minPrice.toLocaleString()}</span>
                  ) : (
                    <span>Free</span>
                  );
                })()
              ) : (
                <span>Free</span> // Or any placeholder for free events
              )}
            </div>

          </div>
          
          {featured && event.description && (
            <p className="text-sm line-clamp-2">{event.description}</p>
          )}
          
          <div className={`flex items-center justify-between ${featured ? 'mt-2' : ''}`}>
            <div className="flex items-center">
              {event.organizer && (
                <>
                  <img 
                    src={event.organizer.image || '/default-organizer-image.jpg'} 
                    alt={event.organizer.name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-muted-foreground">{event.organizer.name}</span>
                </>
              )}
            </div>
            {/* TODO: Don't show tickets available */}
            {/* {ticketsAvailable < 50 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                Only {ticketsAvailable} left
              </Badge>
            )} */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
