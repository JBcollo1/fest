
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Filter, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import EventCard from '@/components/EventCard';
import FeaturedEvent from '@/components/FeaturedEvent';
import AnimatedSection from '@/components/AnimatedSection';
import { eventsData, categories } from '@/utils/data';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const featuredEvent = eventsData.find(event => event.featured);
  
  const filteredEvents = eventsData.filter(event => 
    selectedCategory === 'All' || event.category === selectedCategory
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 md:pt-24">
        {featuredEvent && <FeaturedEvent event={featuredEvent} />}
      </section>
      
      {/* Search Section */}
      <section className="bg-background relative z-10">
        <div className="container mx-auto px-4 -mt-8">
          <SearchBar />
        </div>
      </section>
      
      {/* Upcoming Events Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">Upcoming Events</h2>
                <p className="text-muted-foreground">Discover the best experiences happening in Kenya</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Button variant="outline" asChild>
                  <Link to="/events">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.slice(0, 6).map((event, index) => (
              <AnimatedSection key={event.id} delay={150 + index * 50}>
                <EventCard event={event} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="section-padding bg-muted">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Explore Event Categories</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover events that match your interests across Kenya's vibrant cultural scene
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.filter(category => category !== 'All').slice(0, 5).map((category, index) => (
              <AnimatedSection key={category} delay={100 + index * 50}>
                <Link to={`/events?category=${category}`} className="block">
                  <div className="glass rounded-xl p-6 text-center h-full card-hover">
                    <div className="mb-4 flex justify-center">
                      {category === 'Music' && <MusicIcon />}
                      {category === 'Technology' && <TechIcon />}
                      {category === 'Food & Drink' && <FoodIcon />}
                      {category === 'Adventure' && <AdventureIcon />}
                      {category === 'Cultural' && <CulturalIcon />}
                    </div>
                    <h3 className="font-semibold">{category}</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {getEventCount(category)} events
                    </p>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
      
      {/* Popular Locations Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Popular Locations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Find events happening in major cities across Kenya
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedSection delay={100}>
              <Link to="/events?location=Nairobi" className="block">
                <div className="relative h-80 rounded-xl overflow-hidden card-hover">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: 'url(https://images.unsplash.com/photo-1611348524140-53c9a25308d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80)',
                      filter: 'brightness(0.7)'
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 glass">
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
              <Link to="/events?location=Mombasa" className="block">
                <div className="relative h-80 rounded-xl overflow-hidden card-hover">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: 'url(https://images.unsplash.com/photo-1580224298254-9bbe22c5f07a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80)',
                      filter: 'brightness(0.7)'
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 glass">
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
              <Link to="/events?location=Kisumu" className="block">
                <div className="relative h-80 rounded-xl overflow-hidden card-hover">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: 'url(https://images.unsplash.com/photo-1593117579800-806d62306514?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80)',
                      filter: 'brightness(0.7)'
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 glass">
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
              <p className="text-primary-foreground/90 mb-8">
                Subscribe to our newsletter and never miss out on the latest events in Kenya
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 w-full sm:w-auto flex-1 max-w-md"
                />
                <Button variant="secondary" size="lg">
                  Subscribe
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-card py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-xl font-display font-semibold">EventHub</span>
              </div>
              <p className="text-muted-foreground">
                Your premier platform for discovering and booking events across Kenya.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">Browse Events</Link></li>
                <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQs</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-3">
                {categories.filter(c => c !== 'All').slice(0, 4).map(category => (
                  <li key={category}>
                    <Link to={`/events?category=${category}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <address className="not-italic text-muted-foreground">
                <p>Westlands Business Park</p>
                <p>Nairobi, Kenya</p>
                <p className="mt-2">info@eventhub.co.ke</p>
                <p>+254 700 123 456</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} EventHub Kenya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper function
const getEventCount = (category: string) => {
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
