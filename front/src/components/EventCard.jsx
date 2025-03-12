
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const EventCard = ({ event, featured = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Link 
      to={`/event/${event.id}`}
      className={`block card-hover rounded-xl overflow-hidden ${
        featured ? 'relative md:col-span-2 md:row-span-2 h-full' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full overflow-hidden">
        <div 
          className={`w-full transition-transform duration-700 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          style={{ 
            backgroundImage: `url(${event.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: featured ? '350px' : '220px'
          }}
        />
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="font-medium">
            {event.category}
          </Badge>
        </div>
        {event.featured && !featured && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="default" className="bg-primary font-medium">
              Featured
            </Badge>
          </div>
        )}
      </div>
      
      <div className={`p-4 ${featured ? 'glass absolute bottom-0 left-0 right-0' : 'bg-card'}`}>
        <div className="space-y-3">
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
              <span>{event.location.split(',')[0]}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{event.currency} {event.price.toLocaleString()}</span>
            </div>
          </div>
          
          {featured && (
            <p className="text-sm line-clamp-2">{event.description}</p>
          )}
          
          <div className={`flex items-center justify-between ${featured ? 'mt-2' : ''}`}>
            <div className="flex items-center">
              <img 
                src={event.organizer.image} 
                alt={event.organizer.name}
                className="w-6 h-6 rounded-full mr-2"
              />
              <span className="text-sm text-muted-foreground">{event.organizer.name}</span>
            </div>
            {event.tickets_available < 50 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                Only {event.tickets_available} left
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
