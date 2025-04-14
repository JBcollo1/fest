import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Ticket } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';

const FeaturedEvent = ({ event }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(event.start_datetime) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [event.start_datetime]);

  const formattedDate = new Date(event.start_datetime).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = new Date(event.start_datetime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center rounded-lg"
        style={{ 
          width: '1080px',
          height:'66px',
          backgroundImage: `url(${event.image})`,
          filter: 'brightness(0.5)'
        }}
      />
      
      <div className="relative z-10 flex flex-col md:flex-row h-full min-h-[500px]">
        <div className="flex-1 flex flex-col justify-end p-6 md:p-10">
          <div className="w-full max-w-3xl animate-fade-in">
            {event.categories && event.categories.length > 0 && (
              <Badge className="mb-3 bg-primary" variant="default">
                {event.categories[0].name}
              </Badge>
            )}
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
              {event.title}
            </h1>
            
            <p className="text-white/90 text-base md:text-lg mb-6 max-w-2xl">
              {event.description}
            </p>
            
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                <span className="text-white">{formattedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <span className="text-white">{formattedTime}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <span className="text-white">{event.location}</span>
              </div>
            </div>
            
            <Button asChild className="w-fit">
              <Link to={`/event/${event.id}`}>
                Get Tickets
              </Link>
            </Button>
          </div>
        </div>
        
        {timeLeft.days > 0 && (
          <div className="flex-shrink-0 p-6 md:p-10 flex flex-col justify-center items-center">
            <div className="glass p-6 rounded-xl animate-float">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-3">Event Starts In</h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-bold text-primary">{timeLeft.days}</span>
                    <span className="text-xs text-muted-foreground">Days</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-bold text-primary">{timeLeft.hours}</span>
                    <span className="text-xs text-muted-foreground">Hours</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-bold text-primary">{timeLeft.minutes}</span>
                    <span className="text-xs text-muted-foreground">Mins</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-bold text-primary">{timeLeft.seconds}</span>
                    <span className="text-xs text-muted-foreground">Secs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedEvent;
