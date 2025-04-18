import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Filter, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import EventCard from '@/components/EventCard';
import HeroSlider from '@/components/HeroSlider';
import AnimatedSection from '@/components/AnimatedSection';
import { eventsData, categories } from '@/utils/data';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SafariSection from './Safari';
import { useRef } from 'react';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';

const Index = () => {
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch featured events from API
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const currentDate = new Date().toISOString();
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/featured?start_date=${currentDate}`);
        
        if (response.data?.data) {
          // Events are already sorted by the backend
          setFeaturedEvents(response.data.data);
        } else {
          setError('No featured events found');
        }
      } catch (error) {
        console.error('Error fetching featured events:', error);
        setError(error.response?.data?.message || 'Failed to load featured events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);
  
  // Filter featured events by category if selected
  const filteredEvents = featuredEvents.filter(event => 
    selectedCategory === 'All' || 
    event.categories.some(category => category.name === selectedCategory)
  );

  useEffect(() => {
    const handleScrollToSection = () => {
      if (window.location.hash === '#safari') {
        const safariSection = document.getElementById('safari');
        if (safariSection) {
          safariSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    // Call the function on mount
    handleScrollToSection();

    // Add an event listener for hash changes
    window.addEventListener('hashchange', handleScrollToSection);
    
    // Cleanup the event listener on unmount
    return () => window.removeEventListener('hashchange', handleScrollToSection);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-background'}`}>
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 md:pt-24">
        <HeroSlider />
      </section>
      
      {/* Search Section */}
      <section className="relative z-10">
        <div className="container mx-auto px-4 -mt-8">
          <SearchBar showFilters={false} />
        </div>
      </section>
      
      {/* Upcoming Events Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">Upcoming Events</h2>
                <p className={`${isDarkMode ? 'text-white/70' : 'text-muted-foreground'}`}>Discover the best experiences happening in Kenya</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Button variant="outline" asChild>
                  <Link to="/events">
                    View All <ChevronRight className="text-muted-foreground h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <div className="flex overflow-x-auto pb-4 mb-8 gap-2 scrollbar-none">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm whitespace-nowrap ${
                    selectedCategory === category ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </AnimatedSection>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className={`h-[220px] ${isDarkMode ? 'bg-slate-800' : 'bg-muted'} rounded-xl mb-4`}></div>
                  <div className={`h-4 ${isDarkMode ? 'bg-slate-800' : 'bg-muted'} rounded w-3/4 mb-2`}></div>
                  <div className={`h-4 ${isDarkMode ? 'bg-slate-800' : 'bg-muted'} rounded w-1/2`}></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.slice(0, 6).map((event, index) => (
                <AnimatedSection key={event.id} delay={150 + index * 50}>
                  <EventCard event={event} />
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Categories Section */}
      <section className={`section-padding rounded-xl ${isDarkMode ? 'bg-primary' : 'bg-secondary'}`} id='safari'>
        <SafariSection/>
      </section>
      
      {/* Popular Locations Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Popular Locations</h2>
              <p className={`${isDarkMode ? 'text-white/70' : 'text-muted-foreground'} max-w-2xl mx-auto`}>
                Find events happening in major cities across Kenya
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedSection delay={100}>
              <Link to="/events" state={{ location: 'Nairobi' }} className="block">
                <div className="relative h-80 rounded-xl overflow-hidden card-hover">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: 'url(https://images.unsplash.com/photo-1611348524140-53c9a25308d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80)',
                      filter: isDarkMode ? 'brightness(0.5)' : 'brightness(0.7)'
                    }}
                  />
                  <div className={`absolute bottom-0 left-0 right-0 p-6 ${isDarkMode ? 'bg-slate-900/90' : 'glass'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-display font-semibold">Nairobi</h3>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-primary" />
                          <span className="text-sm">15 upcoming events</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white/20 border-white/10">
                        <MapPin className="h-3 w-3 mr-1" /> Capital City
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
            
            <AnimatedSection delay={150}>
              <Link to="/events" state={{ location: 'Mombasa' }} className="block">
                <div className="relative h-80 rounded-xl overflow-hidden card-hover">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: 'url(https://images.unsplash.com/photo-1580224298254-9bbe22c5f07a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80)',
                      filter: isDarkMode ? 'brightness(0.5)' : 'brightness(0.7)'
                    }}
                  />
                  <div className={`absolute bottom-0 left-0 right-0 p-6 ${isDarkMode ? 'bg-slate-900/90' : 'glass'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-display font-semibold">Mombasa</h3>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-primary" />
                          <span className="text-sm">8 upcoming events</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white/20 border-white/10">
                        <MapPin className="h-3 w-3 mr-1" /> Coastal City
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
            
            <AnimatedSection delay={200}>
              <Link to="/events" state={{ location: 'Kisumu' }} className="block">
                <div className="relative h-80 rounded-xl overflow-hidden card-hover">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: 'url(https://images.unsplash.com/photo-1593117579800-806d62306514?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80)',
                      filter: isDarkMode ? 'brightness(0.5)' : 'brightness(0.7)'
                    }}
                  />
                  <div className={`absolute bottom-0 left-0 right-0 p-6 ${isDarkMode ? 'bg-slate-900/90' : 'glass'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-display font-semibold">Kisumu</h3>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-primary" />
                          <span className="text-sm">6 upcoming events</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white/20 border-white/10">
                        <MapPin className="h-3 w-3 mr-1" /> Lake City
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Stay Updated on Events
              </h2>
              <p className={`mb-8 ${isDarkMode ? 'text-white/70' : 'text-primary-foreground/90'}`}>
                Subscribe to our newsletter and never miss out on the latest events in Kenya
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white/10 border-white/20'} text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 w-full sm:w-auto flex-1 max-w-md`}
                />
                <Button variant="secondary" size="lg">
                  Subscribe
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

// Helper function
const getEventCount = (category) => {
  return eventsData.filter(event => event.category === category).length;
};

// Icon Components
const MusicIcon = () => (
  <div className="w-12 h-12 rounded-full bg-kenya-sunset/10 flex items-center justify-center text-kenya-sunset">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
  </div>
);

const TechIcon = () => (
  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="2" x2="9" y2="4"></line><line x1="15" y1="2" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="22"></line><line x1="15" y1="20" x2="15" y2="22"></line><line x1="20" y1="9" x2="22" y2="9"></line><line x1="20" y1="14" x2="22" y2="14"></line><line x1="2" y1="9" x2="4" y2="9"></line><line x1="2" y1="14" x2="4" y2="14"></line></svg>
  </div>
);

const FoodIcon = () => (
  <div className="w-12 h-12 rounded-full bg-kenya-green/10 flex items-center justify-center text-kenya-green">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
  </div>
);

const AdventureIcon = () => (
  <div className="w-12 h-12 rounded-full bg-kenya-earth/10 flex items-center justify-center text-kenya-earth-dark">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 15 10-10 10 10"></path><path d="M15 15v6h4v-6h2L12 6 3 15h2v6h4v-6z"></path></svg>
  </div>
);

const CulturalIcon = () => (
  <div className="w-12 h-12 rounded-full bg-kenya-savanna/10 flex items-center justify-center text-kenya-savanna-dark">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"></path><path d="M12 6v14"></path><path d="M8 8v12"></path><path d="M4 4v16"></path></svg>
  </div>
);

export default Index;
