import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import EventCard from '@/components/EventCard';
import AnimatedSection from '@/components/AnimatedSection';
import { Button } from "@/components/ui/button";
import { Filter, Calendar, MapPin, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const abortControllerRef = useRef(null);
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
      if (response.data?.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchEvents = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/api/events';
      const params = new URLSearchParams();
      
      if (activeFilter !== 'all') {
        params.append('category', activeFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}${url}`, { signal });
      
      if (response.data?.data?.items) {
        setEvents(response.data.data.items);
        setRetryCount(0); // Reset retry count on success
      } else {
        setEvents([]);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled');
        return;
      }
      
      console.error('Error fetching events:', error);
      setError(error.response?.data?.message || 'Failed to load events');
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery, retryCount]);

  useEffect(() => {
    // Cancel any pending requests when filter or search changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    fetchEvents(abortControllerRef.current.signal);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEvents]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchEvents(abortControllerRef.current.signal);
  };

  return (
    <div className="pt-20 min-h-screen bg-background flex flex-col">
      <section className="pt-24 pb-10 px-4 md:px-8 container mx-auto">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">Discover Events</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore the best events happening in your city and beyond. Find something that interests you and book with just a few clicks.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto mb-10">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              All Events
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={activeFilter === category.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(category.name)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {category.name}
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
        ) : error ? (
          <div className="text-center py-10">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive mr-2" />
              <p className="text-destructive">{error}</p>
            </div>
            {retryCount < 3 ? (
              <p className="text-muted-foreground mb-4">
                Retrying in {Math.min(1000 * Math.pow(2, retryCount), 10000) / 1000} seconds...
              </p>
            ) : (
              <Button onClick={handleRetry} className="mt-4">Try Again</Button>
            )}
          </div>
        ) : (
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {events.length > 0 ? (
                events.map((event) => (
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
        )}
      </section>
    </div>
  );
};

export default Events;