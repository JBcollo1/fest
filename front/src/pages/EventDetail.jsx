import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  Share2, 
  User, 
  Star, 
  ChevronLeft,
  Plus,
  Minus
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AnimatedSection from '@/components/AnimatedSection';
import { eventsData } from '@/utils/data';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState(1);
  
  useEffect(() => {
    // Simulate API fetch with timeout
    const timer = setTimeout(() => {
      const foundEvent = eventsData.find(e => e.id === id);
      setEvent(foundEvent || null);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [id]);
  
  const increaseTickets = () => {
    if (event && selectedTickets < event.tickets_available) {
      setSelectedTickets(prev => prev + 1);
    }
  };
  
  const decreaseTickets = () => {
    if (selectedTickets > 1) {
      setSelectedTickets(prev => prev - 1);
    }
  };
  
  const formattedDate = event ? new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-32 h-32 mx-auto rounded-full bg-muted"></div>
          <div className="h-6 bg-muted rounded w-48 mx-auto mt-4"></div>
          <div className="h-4 bg-muted rounded w-64 mx-auto mt-2"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-semibold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">Sorry, the event you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20">
        <div 
          className="w-full h-[40vh] md:h-[50vh] bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${event.image})`,
            filter: 'brightness(0.7)'
          }}
        />
        
        <div className="container mx-auto px-4 relative">
          <div className="glass rounded-xl p-8 max-w-4xl mx-auto -mt-24 relative z-10">
            <Badge className="mb-4" variant="outline">{event.category}</Badge>
            <h1 className="text-2xl md:text-4xl font-display font-bold mb-4">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap gap-y-4 gap-x-6 mb-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <span>{event.location}</span>
              </div>
            </div>
            
            <div className="flex items-center mb-8">
              <img 
                src={event.organizer.image} 
                alt={event.organizer.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-medium">{event.organizer.name}</p>
                <p className="text-sm text-muted-foreground">Event Organizer</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-semibold">{event.currency} {event.price.toLocaleString()}</p>
              </div>
              
              <Button variant="outline" className="rounded-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Event
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Event Details Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="md:col-span-2">
              <AnimatedSection>
                <h2 className="text-xl md:text-2xl font-display font-semibold mb-4">About This Event</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-base/relaxed mb-4">
                    {event.description}
                  </p>
                  <p className="text-base/relaxed mb-4">
                    Join us for an unforgettable experience at {event.title}. This event promises to be a highlight of the year, bringing together people from all walks of life to celebrate and enjoy this special occasion. Whether you're a long-time enthusiast or new to the scene, there's something for everyone.
                  </p>
                  <p className="text-base/relaxed">
                    Don't miss out on this opportunity to be part of something extraordinary. Tickets are limited, so secure yours today!
                  </p>
                </div>
              </AnimatedSection>
              
              <AnimatedSection delay={100}>
                <div className="mt-10">
                  <h2 className="text-xl md:text-2xl font-display font-semibold mb-4">Location</h2>
                  <div className="rounded-xl overflow-hidden h-[300px] bg-muted">
                    <GoogleMapEmbed 
                      location={event.location}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </AnimatedSection>
              
              <AnimatedSection delay={150}>
                <div className="mt-10">
                  <h2 className="text-xl md:text-2xl font-display font-semibold mb-4">Reviews & Ratings</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <img 
                        src="https://randomuser.me/api/portraits/women/44.jpg" 
                        alt="Reviewer"
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-medium">Sarah M.</h4>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${star <= 5 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Attended on Jan 15, 2023</p>
                        <p className="text-sm">
                          Absolutely amazing event! The organization was flawless and the experience exceeded my expectations. Would definitely attend again next year.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <img 
                        src="https://randomuser.me/api/portraits/men/32.jpg" 
                        alt="Reviewer"
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-medium">James K.</h4>
                          <div className="flex">
                            {[1, 2, 3, 4].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                            <Star className="h-4 w-4 text-gray-300" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Attended on Dec 20, 2022</p>
                        <p className="text-sm">
                          Great event overall. The venue was perfect and the program was well-organized. My only suggestion would be to improve the sound system.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="mt-6">
                    View All Reviews
                  </Button>
                </div>
              </AnimatedSection>
            </div>
            
            {/* Ticket Purchase Section */}
            <div className="md:col-span-1">
              <AnimatedSection>
                <div className="glass rounded-xl p-6 sticky top-24">
                  <h2 className="text-xl font-semibold mb-4">Get Tickets</h2>
                  
                  <div className="mb-6">
                    <p className="text-muted-foreground mb-1">Available Tickets</p>
                    <p className="font-medium">{event.tickets_available} remaining</p>
                    
                    <div className="w-full bg-muted h-2 rounded-full mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (1 - event.tickets_available / 300) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-muted-foreground mb-2">Select Quantity</p>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decreaseTickets}
                        disabled={selectedTickets <= 1}
                        className="h-10 w-10 rounded-full"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="mx-4 text-lg font-medium w-8 text-center">{selectedTickets}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={increaseTickets}
                        disabled={event && selectedTickets >= event.tickets_available}
                        className="h-10 w-10 rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span>Price per ticket</span>
                      <span>{event.currency} {event.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Quantity</span>
                      <span>{selectedTickets}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Service fee</span>
                      <span>{event.currency} {(event.price * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg mt-4 pt-4 border-t border-border">
                      <span>Total</span>
                      <span>{event.currency} {((event.price + event.price * 0.05) * selectedTickets).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full" size="lg">
                    <Ticket className="h-4 w-4 mr-2" />
                    Buy Tickets
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By purchasing tickets you agree to our terms of service and privacy policy.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetail;
