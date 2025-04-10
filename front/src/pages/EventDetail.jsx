import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

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
  Mail,
  Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AnimatedSection from '@/components/AnimatedSection';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import GoogleMapEmbed from '@/components/GoogleMapEmbed';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";


const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchEventById, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
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
        
        // Check if we have saved tickets for this event

        
        // Check if we have saved tickets for this event
        const savedTickets = localStorage.getItem(`event_${id}_tickets`);
        if (savedTickets) {
          try {
            const parsedTickets = JSON.parse(savedTickets);
            if (parsedTickets.eventId === id) {
              setSelectedTickets(parsedTickets.tickets);
              localStorage.removeItem(`event_${id}_tickets`);
            } else {
              setSelectedTickets(initialSelectedTickets);
            }
          } catch (e) {
            console.error("Error parsing saved tickets:", e);
            setSelectedTickets(initialSelectedTickets);
          }
        } else {
          setSelectedTickets(initialSelectedTickets);
        }
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

  const handlePurchase = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/event/${id}`);
      
      localStorage.setItem(`event_${id}_tickets`, JSON.stringify({
        eventId: id,
        tickets: selectedTickets
      }));
      
      toast({
        title: "Authentication required",
        description: "Please sign in to purchase tickets",
        variant: "default",
      });
      navigate(`/signin?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/event/${id}`);
      
      localStorage.setItem(`event_${id}_tickets`, JSON.stringify({
        eventId: id,
        tickets: selectedTickets
      }));
      
      toast({
        title: "Authentication required",
        description: "Please sign in to purchase tickets",
        variant: "default",
      });
      navigate(`/signin?returnUrl=${returnUrl}`);
      return;
    }

    try {
      setIsPurchasing(true);
      const ticketDetails = Object.keys(selectedTickets).map(ticketTypeId => ({
        ticket_type_id: ticketTypeId,
        quantity: selectedTickets[ticketTypeId]
      }));

      const totalAmount = Object.keys(selectedTickets).reduce((total, ticketTypeId) => {
        const ticketType = event.ticket_types.find(type => type.id === ticketTypeId);
        return total + (ticketType.price * selectedTickets[ticketTypeId]);
      }, 0);

      // Send the purchase request to the backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${event.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies with the request
        body: JSON.stringify({
          ticket_details: ticketDetails,
          total_amount: totalAmount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to purchase tickets');
      }

      const responseData = await response.json();
      
      if (responseData.message && responseData.message.includes("Payment initiated successfully")) {
        toast({
          title: "Payment Initiated",
          description: "Please complete the payment on your phone. You'll be notified via email when your payment is confirmed.",
          duration: 7000,
        });
        
        localStorage.removeItem(`event_${id}_tickets`);
        
      } else {
        toast({
          title: "Unexpected Response",
          description: "There was an issue with the payment process. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error purchasing tickets:", error);
      toast({
        title: "Error",
        description: "Failed to purchase tickets. Please try again.",
        variant: "destructive",
      });
      toast({
        title: "Error",
        description: "Failed to purchase tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsPurchasing(false), 40000);
    }
  };

  // Calculate total price
  const totalPrice = Object.keys(selectedTickets).reduce((total, ticketTypeId) => {
    const ticketType = event.ticket_types.find(type => type.id === ticketTypeId);
    return total + (ticketType.price * selectedTickets[ticketTypeId]);
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className={`w-32 h-32 mx-auto rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-muted'}`}></div>
          <div className={`h-6 ${isDarkMode ? 'bg-slate-700' : 'bg-muted'} rounded w-48 mx-auto mt-4`}></div>
          <div className={`h-4 ${isDarkMode ? 'bg-slate-700' : 'bg-muted'} rounded w-64 mx-auto mt-2`}></div>
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
    <div className={`pt-20 min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-background'}`}>
      {isDarkMode && (
        <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-purple-900/20 to-transparent pointer-events-none" />
      )}
      
      {/* Main Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Left Column - Event Image with Details Slightly Overlapping */}
            <div className="relative">
              {/* Event Image */}
              <div 
                className="w-full h-[550px] md:h-[500px] rounded-xl overflow-hidden"
                // style={{ 
                //   height: '90%', 
                //   width: '100%',
                //   maxHeight: '650px',
                //   maxWidth: '100%',
                  
                // }}
              >
                <img 
                  src={event.image || '/default-event-image.jpg'} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                  style={{ 
                    filter: isDarkMode ? 'brightness(0.7)' : 'brightness(0.9)'
                  }}
                  onError={(e) => {
                    e.target.src = '/default-event-image.jpg';
                  }}
                />
              </div>
  
              {/* Event Details Card - Slightly Overlapping with higher z-index */}
              <div className={`${isDarkMode ? 'bg-slate-900/90 border border-slate-800' : 'glass'} rounded-xl p-6 mb-8 relative -mt-24 translate-y-[50px] z-20 mx-2 shadow-lg`}>
                <div className="flex gap-2  mb-4">
                  {event.categories?.map(category => (
                    <Badge key={category.id} variant={isDarkMode ? "default" : "outline"}>{category.name}</Badge>
                  ))}
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  {event.title}
                </h1>
                
                <div className="flex flex-col gap-y-3 mb-6">
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
                
                <div className="flex items-center mb-6">
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                    >
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
              
              {/* About This Event - Below the card */}
              <div className="mt-6">
                <AnimatedSection>
                  <h2 className="text-xl font-display font-semibold mb-4">About This Event</h2>
                  <div className="prose prose-slate max-w-none dark:prose-invert">
                    <p className="text-base/relaxed mb-4">
                      {event.description}
                    </p>
                    <p className="text-base/relaxed mb-4">
                      Join us for an unforgettable experience at {event.title}. This event promises to be a highlight of the year, bringing together people from all walks of life to celebrate and enjoy this special occasion.
                    </p>
                    <p className="text-base/relaxed">
                      Don't miss out on this opportunity to be part of something extraordinary. Tickets are limited, so secure yours today!
                    </p>
                  </div>
                </AnimatedSection>
                
                <AnimatedSection delay={100}>
                  <div className="mt-10 flex flex-col">
                    <h2 className="text-xl font-display font-semibold mb-4">Location</h2>
                    <div className={`rounded-xl overflow-hidden h-[300px] ${isDarkMode ? 'bg-slate-800' : 'bg-muted'}`} style={{ minHeight: '500px' }}>
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
            </div>
            
            {/* Right Column - Ticket Purchase Section */}
            {/* Right Column - Ticket Purchase Section */}
            <div className="md:col-span-1" id="tickets-section">
              <div className="sticky top-24">
                <AnimatedSection>
                  <div className={`${isDarkMode ? 'bg-slate-900/90 border border-slate-800' : 'glass'} rounded-xl p-6`}>
                    <h2 className="text-xl font-semibold mb-4">Get Tickets</h2>
                    
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-2xl font-semibold">
                        {event.ticket_types && event.ticket_types.length > 0 ? (
                          (() => {
                            // Find the minimum price among ticket types
                            const minPrice = Math.min(...event.ticket_types.map(type => type.price || 0));
                            return minPrice > 0 ? `${event.currency} ${minPrice.toLocaleString()}` : "Free";
                          })()
                        ) : (
                          "Free"
                        )}
                      </p>
                    </div>
                    
                    {event.ticket_types.map(ticketType => (
                      <div key={ticketType.id} className="mb-6">
                        <p className="text-muted-foreground mb-2">
                          {ticketType.name} - Holds up to {ticketType.per_person_limit || 'unlimited'} people
                        </p>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => decreaseTickets(ticketType.id)}
                            disabled={selectedTickets[ticketType.id] <= 0}
                            className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="mx-4 text-lg font-medium w-8 text-center">{selectedTickets[ticketType.id]}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => increaseTickets(ticketType.id)}
                            disabled={selectedTickets[ticketType.id] >= ticketType.quantity - ticketType.tickets_sold}
                            className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span>Price per ticket</span>
                          {ticketType.price !== null && ticketType.price !== undefined ? (
                            <span>{event.currency} {ticketType.price.toLocaleString()}</span>
                          ) : (
                            <span>Free</span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-border'} pt-4 mb-6`}>
                      <div className={`flex justify-between font-semibold text-lg mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-border'}`}>
                        <span>Total</span>
                        <span>{event.currency} {totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handlePurchase} 
                      disabled={isPurchasing || totalPrice < 1}
                    >
                      {isPurchasing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Ticket className="h-4 w-4 mr-2" />
                      )}
                      {isPurchasing ? 'Processing...' : 'Buy Tickets'}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      By purchasing tickets you agree to our terms of service and privacy policy.
                    </p>
                  </div>
                </AnimatedSection>
              </div>
              <div className="sticky top-24">
                <AnimatedSection>
                  <div className={`${isDarkMode ? 'bg-slate-900/90 border border-slate-800' : 'glass'} rounded-xl p-6`}>
                    <h2 className="text-xl font-semibold mb-4">Get Tickets</h2>
                    
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-2xl font-semibold">
                        {event.ticket_types && event.ticket_types.length > 0 ? (
                          (() => {
                            // Find the minimum price among ticket types
                            const minPrice = Math.min(...event.ticket_types.map(type => type.price || 0));
                            return minPrice > 0 ? `${event.currency} ${minPrice.toLocaleString()}` : "Free";
                          })()
                        ) : (
                          "Free"
                        )}
                      </p>
                    </div>
                    
                    {event.ticket_types.map(ticketType => (
                      <div key={ticketType.id} className="mb-6">
                        <p className="text-muted-foreground mb-2">
                          {ticketType.name} - Holds up to {ticketType.per_person_limit || 'unlimited'} people
                        </p>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => decreaseTickets(ticketType.id)}
                            disabled={selectedTickets[ticketType.id] <= 0}
                            className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="mx-4 text-lg font-medium w-8 text-center">{selectedTickets[ticketType.id]}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => increaseTickets(ticketType.id)}
                            disabled={selectedTickets[ticketType.id] >= ticketType.quantity - ticketType.tickets_sold}
                            className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span>Price per ticket</span>
                          {ticketType.price !== null && ticketType.price !== undefined ? (
                            <span>{event.currency} {ticketType.price.toLocaleString()}</span>
                          ) : (
                            <span>Free</span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-border'} pt-4 mb-6`}>
                      <div className={`flex justify-between font-semibold text-lg mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-border'}`}>
                        <span>Total</span>
                        <span>{event.currency} {totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handlePurchase} 
                      disabled={isPurchasing || totalPrice < 1}
                    >
                      {isPurchasing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Ticket className="h-4 w-4 mr-2" />
                      )}
                      {isPurchasing ? 'Processing...' : 'Buy Tickets'}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      By purchasing tickets you agree to our terms of service and privacy policy.
                    </p>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetail;
