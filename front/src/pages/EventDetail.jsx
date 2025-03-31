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
  Minus,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Linkedin,
  Mail
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AnimatedSection from '@/components/AnimatedSection';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import GoogleMapEmbed from '@/components/GoogleMapEmbed';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EventDetail = () => {
  const { id } = useParams();
  const { fetchEventById } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);
  
  const scrollToTickets = () => {
    const ticketsSection = document.getElementById('tickets-section');
    if (ticketsSection) {
      const yOffset = -100; // Offset to account for fixed header
      const y = ticketsSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const eventData = await fetchEventById(id);
        setEvent(eventData);

        // Initialize selected tickets state
        const initialSelectedTickets = {};
        if (eventData && eventData.ticket_types) {
          eventData.ticket_types.forEach(type => {
            initialSelectedTickets[type.id] = 0;
          });
        }
        setSelectedTickets(initialSelectedTickets);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [id, fetchEventById]);
  
  const increaseTickets = (ticketTypeId) => {
    if (event) {
      const ticketType = event.ticket_types.find(type => type.id === ticketTypeId);
      if (selectedTickets[ticketTypeId] < ticketType.quantity - ticketType.tickets_sold) {
        setSelectedTickets(prev => ({
          ...prev,
          [ticketTypeId]: prev[ticketTypeId] + 1
        }));
      }
    }
  };
  
  const decreaseTickets = (ticketTypeId) => {
    if (selectedTickets[ticketTypeId] > 0) {
      setSelectedTickets(prev => ({
        ...prev,
        [ticketTypeId]: prev[ticketTypeId] - 1
      }));
    }
  };
  
  const formattedDate = event ? new Date(event.start_datetime).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '';

  const formattedTime = event ? new Date(event.start_datetime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(event.title);
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${title}&body=Check out this event: ${url}`;
        break;
      default:
        return;
    }

    // Open in new tab for social media, new window for email
      window.open(shareUrl, '_blank');

  };

  const handlePurchase = () => {
    // Implement purchase logic here
    console.log("Purchasing tickets:", selectedTickets);
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-semibold mb-4">Error Loading Event</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
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
            backgroundImage: `url(${event.image || '/default-event-image.jpg'})`,
            filter: 'brightness(0.7)'
          }}
        />
        
        <div className="container mx-auto px-4 relative">
          <div className="glass rounded-xl p-8 max-w-4xl mx-auto -mt-24 relative z-10">
            <div className="flex gap-2 mb-4">
              {event.categories?.map(category => (
                <Badge key={category.id} variant="outline">{category.name}</Badge>
              ))}
            </div>
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
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <span>{event.location}</span>
              </div>
            </div>
            
            <div className="flex items-center mb-8">
              <img 
                src={event.organizer?.image || '/default-organizer-image.jpg'} 
                alt={event.organizer?.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-medium">{event.organizer?.name}</p>
                <p className="text-sm text-muted-foreground">Event Organizer</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
            <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p 
                  className="text-2xl font-semibold cursor-pointer hover:text-primary transition-colors" 
                  onClick={scrollToTickets}
                >
                  {event.price !== null && event.price !== undefined ? (
                    `${event.currency} ${event.price.toLocaleString()}`
                  ) : (
                    "Free"
                  )}
                </p>
              </div>

              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Event
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {copySuccess ? 'Link Copied!' : 'Copy Link'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
                    <Facebook className="h-4 w-4 mr-2" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
                    <Twitter className="h-4 w-4 mr-2" />
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('linkedin')} className="cursor-pointer">
                    <Linkedin className="h-4 w-4 mr-2" />
                    Share on LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('email')} className="cursor-pointer">
                    <Mail className="h-4 w-4 mr-2" />
                    Share via Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            </div>
            
            {/* Ticket Purchase Section */}
            <div className="md:col-span-1" id="tickets-section">
              <AnimatedSection>
                <div className="glass rounded-xl p-6 sticky top-24">
                  <h2 className="text-xl font-semibold mb-4">Get Tickets</h2>
                  
                  {event.ticket_types.map(ticketType => (
                    <div key={ticketType.id} className="mb-6">
                      <p className="text-muted-foreground mb-2">{ticketType.name}</p>
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => decreaseTickets(ticketType.id)}
                          disabled={selectedTickets[ticketType.id] <= 0}
                          className="h-10 w-10 rounded-full"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="mx-4 text-lg font-medium w-8 text-center">{selectedTickets[ticketType.id]}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => increaseTickets(ticketType.id)}
                          disabled={selectedTickets[ticketType.id] >= ticketType.quantity - ticketType.tickets_sold}
                          className="h-10 w-10 rounded-full"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span>Price per ticket</span>
                        {ticketType.price !== null && ticketType.price !== undefined ? (
                          <span>{event.currency} {ticketType.price.toLocaleString()}</span>
                        ) : (
                          <span>Free</span> // Or any placeholder for free tickets
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between font-semibold text-lg mt-4 pt-4 border-t border-border">
                      <span>Total</span>
                      <span>{event.currency} {Object.keys(selectedTickets).reduce((total, ticketTypeId) => {
                        const ticketType = event.ticket_types.find(type => type.id === ticketTypeId);
                        return total + (ticketType.price * selectedTickets[ticketTypeId]);
                      }, 0).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full" size="lg" onClick={handlePurchase}>
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
