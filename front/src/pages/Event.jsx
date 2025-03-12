import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import EventCard from '@/components/EventCard';
import AnimatedSection from '@/components/AnimatedSection';
import { eventsData, categories } from '@/utils/data';
import { Button } from "@/components/ui/button";
import { Filter, Calendar, MapPin } from 'lucide-react';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');

  
  const categories = ['all', 'music', 'business', 'food', 'art', 'tech', 'sports'];
  
  useEffect(() => {
    // Simulate API fetch with timeout
    const timer = setTimeout(() => {
      setEvents(eventsData);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const filteredEvents = eventsData.filter(event => 
    selectedCategory === 'All' || event.category === selectedCategory
  );

  return (
    <div className=" pt-20 min-h-screen bg-background flex flex-col">
    
      
      <section className="pt-24 pb-10 px-4 md:px-8 container mx-auto">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">Discover Events</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore the best events happening in your city and beyond. Find something that interests you and book with just a few clicks.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto mb-10">
            <SearchBar />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map((category) => (
              <Button 
                key={category}
                variant={activeFilter === category ? "default" : "outline"}
                onClick={() => setActiveFilter(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </AnimatedSection>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="animate-pulse rounded-xl overflow-hidden">
                <div className="h-48 bg-muted"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-8 bg-muted rounded w-1/3 mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <AnimatedSection delay={100}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10">
                    <h3 className="text-xl font-medium mb-2">No events found</h3>
                    <p className="text-muted-foreground mb-6">Try changing your filter or search criteria</p>
                    <Button onClick={() => setActiveFilter('all')}>View All Events</Button>
                  </div>
                )}
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={200}>
              <div className="flex flex-col items-center mt-16 mb-8">
                <h2 className="text-2xl font-display font-semibold mb-8">Top Cities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                  {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'].map((city) => (
                    <div key={city} className="glass rounded-xl p-6 text-center card-hover">
                      <MapPin className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h3 className="font-medium">{city}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {Math.floor(Math.random() * 15) + 5} Events
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-center my-16">
                <h2 className="text-2xl font-display font-semibold mb-8">Upcoming Months</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                  {['June', 'July', 'August', 'September'].map((month) => (
                    <div key={month} className="glass rounded-xl p-6 text-center card-hover">
                      <Calendar className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h3 className="font-medium">{month}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {Math.floor(Math.random() * 20) + 10} Events
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </>
        )}
      </section>
    </div>
  );
};

export default Events;
