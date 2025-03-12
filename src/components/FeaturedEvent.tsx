
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Ticket } from 'lucide-react';
import { Event } from '@/utils/data';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';

interface FeaturedEventProps {
  event: Event;
}

const FeaturedEvent = ({ event }: FeaturedEventProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(event.date) - +new Date();
      
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
  }, [event.date]);

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${event.image})`,
          filter: 'brightness(0.5)'
        }}
      />
      
      <div className="relative z-10 flex flex-col md:flex-row h-full min-h-[500px]">
        <div className="flex-1 flex flex-col justify-end p-6 md:p-10">
          <div className="w-full max-w-3xl animate-fade-in">
            <Badge className="mb-3 bg-primary" variant="default">{event.category}</Badge>
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
                <span className="text-white">{event.time}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <span className="text-white">{event.location}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to={`/event/${event.id}`}>
                  <Ticket className="h-5 w-5 mr-2" />
                  Buy Tickets
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Learn More
              </Button>
            </div>
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
