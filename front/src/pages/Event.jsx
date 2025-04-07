import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const abortControllerRef = useRef(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const eventsCache = useRef({
    all: [],
    byCategory: {},
    bySearch: {},
    byLocation: {}
  });
  
  // Get search parameters from URL or state
  const searchFromUrl = searchParams.get('query');
  const categoryFromUrl = searchParams.get('category');
  const locationFromState = location.state?.location;
  const searchFromState = location.state?.searchParams;
  
  useEffect(() => {
    if (searchFromState) {
      setSearchQuery(searchFromState.query || '');
      if (searchFromState.category) {
        setActiveFilter(searchFromState.category);
      }
      if (searchFromState.location) {
        setSelectedLocation(searchFromState.location);
      }
    } else if (searchFromUrl || categoryFromUrl || locationFromState) {
      setSearchQuery(searchFromUrl || '');
      if (categoryFromUrl) {
        setActiveFilter(categoryFromUrl);
      }
      if (locationFromState) {
        setSelectedLocation(locationFromState);
      }
    }
  }, [searchFromState, searchFromUrl, categoryFromUrl, locationFromState]);
  
  // Get location from URL params or state
  const locationFromUrl = searchParams.get('location');
  useEffect(() => {
    if (locationFromUrl) {
      setSelectedLocation(locationFromUrl);
    }
  }, [locationFromUrl]);
  
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
  
  const getCacheKey = useCallback(() => {
    let key = 'all';
    if (activeFilter !== 'all') key = `category:${activeFilter}`;
    if (searchQuery) key += `:search:${searchQuery}`;
    if (selectedLocation) key += `:location:${selectedLocation}`;
    return key;
  }, [activeFilter, searchQuery, selectedLocation]);
  
  // Function to check if we have cached data for current filters
  const getCachedEvents = useCallback(() => {
    console.log("fetched from cache")
    const key = getCacheKey();
    
    if (eventsCache.current[key]) {
      // cache of all or category or search or location
      return eventsCache.current[key];
    }
    
    // If searching with a category filter, we can use "all events" of that category as initial data
    if (searchQuery && activeFilter !== 'all') {
      const categoryKey = `category:${activeFilter}`;
      if (eventsCache.current[categoryKey]) {
        return eventsCache.current[categoryKey].filter(event => 
          event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }
    
    // For location-based searches
    if (selectedLocation && eventsCache.current.all.length > 0) {
      return eventsCache.current.all.filter(event => 
        event.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    // filter client-side if we have all the events fetched before
    if (eventsCache.current.all.length > 0 && (activeFilter !== 'all' || searchQuery || selectedLocation)) {
      return eventsCache.current.all.filter(event => {
        let matchesCategory = activeFilter === 'all' || event.category === activeFilter;
        let matchesSearch = !searchQuery || 
          event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesLocation = !selectedLocation || 
          event.location?.toLowerCase().includes(selectedLocation.toLowerCase());
        
        return matchesCategory && matchesSearch && matchesLocation;
      });
    }
    
    return null; // No suitable cache found
  }, [activeFilter, searchQuery, selectedLocation, getCacheKey]);
  
  const fetchEvents = useCallback(async (signal) => {
    const cachedEvents = getCachedEvents();
    const key = getCacheKey();
    
    if (cachedEvents && cachedEvents.length > 0) {
      setEvents(cachedEvents);
      setIsLoading(false);
      
      if (Date.now() - (eventsCache.current.lastFetchTime || 0) > 30000) { // 30 seconds cache
        try {
          let url = '/api/events';
          const params = new URLSearchParams();
          
          if (activeFilter !== 'all') {
            params.append('category', activeFilter);
          }
          
          if (searchQuery && typeof searchQuery === 'string' && searchQuery !== '') {
            params.append('search', searchQuery);
          }
          
          if (selectedLocation) {
            params.append('location', selectedLocation);
          }
          
          if (params.toString()) {
            url += `?${params.toString()}`;
          }
          
          const response = await axios.get(`${import.meta.env.VITE_API_URL}${url}`, { signal });
          
          if (response.data?.data?.items) {
            const newEvents = response.data.data.items;
            
            const hasNewEvents = newEvents.some(newEvent => 
              !cachedEvents.some(cachedEvent => cachedEvent.id === newEvent.id)
            );
            
            if (hasNewEvents || newEvents.length !== cachedEvents.length) {
              setEvents(newEvents);
              eventsCache.current[key] = newEvents;
              eventsCache.current.lastFetchTime = Date.now();
              
              if (activeFilter === 'all' && !searchQuery && !selectedLocation) {
                eventsCache.current.all = newEvents;
              }
            }
          }
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error('Error fetching latest events:', error);
            setError('Unable to refresh events. Please try again later.');
          }
        }
      }
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      let url = '/api/events';
      const params = new URLSearchParams();
      
      if (activeFilter !== 'all') {
        params.append('category', activeFilter);
      }
      
      if (searchQuery && typeof searchQuery === 'string' && searchQuery !== '') {
        params.append('search', searchQuery);
      }
      
      if (selectedLocation) {
        params.append('location', selectedLocation);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}${url}`, { signal });
      
      if (response.data?.data?.items) {
        const newEvents = response.data.data.items;
        setEvents(newEvents);
        
        // Update cache
        eventsCache.current[key] = newEvents;
        eventsCache.current.lastFetchTime = Date.now();
        
        // Update main cache if applicable
        if (activeFilter === 'all' && !searchQuery && !selectedLocation) {
          eventsCache.current.all = newEvents;
        } else if (activeFilter !== 'all' && !searchQuery && !selectedLocation) {
          const categoryKey = `category:${activeFilter}`;
          eventsCache.current[categoryKey] = newEvents;
        }
        
        setRetryCount(0);
      } else {
        setEvents([]);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled');
        return;
      }
      
      console.error('Error fetching events:', error);
      setError('Unable to load events. Please try again later.');
      setEvents([]);
      
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery, retryCount, selectedLocation, getCachedEvents, getCacheKey]);

  useEffect(() => {
    // Cancel any pending requests when filter or search changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const timeoutId = setTimeout(() => {
      fetchEvents(abortControllerRef.current.signal);
    }, searchQuery ? 300 : 0); // 300ms delay for search, no delay for other filters
    
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEvents]);

  const handleSearch = (searchParams) => {
    setSearchQuery(searchParams.query || '');
    
    if (searchParams.category) {
      setActiveFilter(searchParams.category);
    }
    
    if (searchParams.location) {
      setSelectedLocation(searchParams.location);
      // When location is selected, set active filter to "all" to show all events in that location
      setActiveFilter('all');
    } else {
      setSelectedLocation('');
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchEvents(abortControllerRef.current.signal);
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    setSearchQuery(''); // Clear search when changing filters
    
    // When selecting "all", clear all filters
    if (filter === 'all') {
      setSelectedCategory('');
      setSelectedLocation('');
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-background flex flex-col">
      <section className="pt-24 pb-10 px-4 md:px-8 container mx-auto">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              {selectedLocation ? `Events in ${selectedLocation}` : 'Discover Events'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {selectedLocation 
                ? `Explore the best events happening in ${selectedLocation}. Find something that interests you and book with just a few clicks.`
                : 'Explore the best events happening in your city and beyond. Find something that interests you and book with just a few clicks.'}
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto mb-10">
            <SearchBar 
              onSearch={handleSearch}
              initialQuery={searchQuery}
              initialCategory={activeFilter}
              initialLocation={selectedLocation}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterClick('all')}
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
                onClick={() => handleFilterClick(category.name)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {category.name}
              </Button>
            ))}
          </div>
        </AnimatedSection>
        
        {isLoading && !events.length ? (
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
                  <Button onClick={() => handleFilterClick('all')}>View All Events</Button>
                </div>
              )}
            </div>
            {isLoading && events.length > 0 && (
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">Refreshing results...</p>
              </div>
            )}
          </AnimatedSection>
        )}
      </section>
    </div>
  );
};

export default Events;