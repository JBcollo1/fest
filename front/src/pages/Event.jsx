import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import EventCard from '@/components/EventCard';
import AnimatedSection from '@/components/AnimatedSection';
import { Button } from "@/components/ui/button";
import { Filter, Calendar, MapPin, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // New state for refreshing vs initial load
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
  const { isDarkMode } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    date: '',
    price: ''
  });
  const [showPastEvents, setShowPastEvents] = useState(false);
  const mountedRef = useRef(true);
  
  // Cache for events data
  const eventsCache = useRef({});
  const lastFetchParams = useRef(null);
  
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
  
  // Create a cache key from filters
  const createCacheKey = (activeFilter, searchQuery, selectedLocation, filters, showPastEvents) => {
    return JSON.stringify({
      activeFilter,
      searchQuery,
      selectedLocation,
      filters,
      showPastEvents
    });
  };

  const fetchEvents = async (filters = {}, forceRefresh = false) => {
    if (!mountedRef.current) return;

    // Build query params for cache key
    const cacheKey = createCacheKey(
      activeFilter,
      searchQuery,
      selectedLocation,
      filters,
      showPastEvents
    );
    
    // Check if we have cached data and aren't forcing a refresh
    if (!forceRefresh && eventsCache.current[cacheKey]) {
      setEvents(eventsCache.current[cacheKey]);
      setIsLoading(false);
      return;
    }
    
    // If we're refreshing current data, show refreshing state instead of loading
    if (events.length > 0 && !forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    lastFetchParams.current = cacheKey;

    try {
      // Build query params
      const queryParams = new URLSearchParams();
      
      // Add base filters
      if (activeFilter !== 'all') {
        queryParams.append('category', activeFilter);
      }
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      if (selectedLocation) {
        queryParams.append('location', selectedLocation);
      }
      
      // Add show_past parameter
      queryParams.append('show_past', showPastEvents.toString());
      
      // Add additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/events?${queryParams.toString()}`,
        { 
          withCredentials: true,
          headers: {
            // Remove cache-control headers to allow browser caching
          }
        }
      );

      if (!mountedRef.current) return;

      // Handle the response structure correctly
      if (response.data && response.data[0] && response.data[0].data) {
        const fetchedEvents = response.data[0].data;
        // Update cache with new data
        eventsCache.current[cacheKey] = fetchedEvents;
        // Only update state if this is still the most recent request
        if (lastFetchParams.current === cacheKey) {
          setEvents(fetchedEvents);
        }
      } else {
        setError('No events found matching your criteria');
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error fetching events:', error);
      setError(error.response?.data?.message || 'Failed to load events. Please try again later.');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Initial load
  useEffect(() => {
    console.log('Initial fetch triggered');
    fetchEvents(filters);
  }, [filters]);

  // Handle filter changes with debounce
  useEffect(() => {
    console.log('Filter change detected:', { activeFilter, searchQuery, selectedLocation, filters, showPastEvents });
    // Cancel any pending requests when filter or search changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Debounce search to prevent too many API calls
    const timeoutId = setTimeout(() => {
      console.log('Fetching events with filters:', filters);
      fetchEvents(filters);
    }, searchQuery ? 500 : 0);
    
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [activeFilter, searchQuery, selectedLocation, filters, showPastEvents]);

  // Add a refresh function that forces bypass of cache
  const refreshEvents = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    fetchEvents(filters, true); // Force refresh
  }, [filters]);

  // Add a retry mechanism
  const handleRetry = () => {
    refreshEvents();
  };

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

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    setSearchQuery(''); // Clear search when changing filters
    
    // When selecting "all", clear all filters
    if (filter === 'all') {
      setSelectedCategory('');
      setSelectedLocation('');
    }
  };

  // Add toggle for past events
  const togglePastEvents = () => {
    setShowPastEvents(!showPastEvents);
  };

  return (
    <div className={`pt-20 min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-background'}`}>
      {isDarkMode && (
        <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-purple-900/20 to-transparent pointer-events-none" />
      )}
      
      <section className="pt-24 pb-10 px-4 md:px-8 container mx-auto relative">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h1 className={`text-3xl md:text-4xl font-display font-bold mb-3 ${isDarkMode ? 'text-white' : ''}`}>
              {selectedLocation ? `Events in ${selectedLocation}` : 'Discover Events'}
            </h1>
            <p className={`${isDarkMode ? 'text-white/80' : 'text-muted-foreground'} max-w-2xl mx-auto`}>
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
              className={`flex items-center gap-2 ${isDarkMode && activeFilter !== 'all' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
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
                className={`flex items-center gap-2 ${isDarkMode && activeFilter !== category.name ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
              >
                <Filter className="w-4 h-4" />
                {category.name}
              </Button>
            ))}
            <Button
              variant={showPastEvents ? 'default' : 'outline'}
              size="sm"
              onClick={togglePastEvents}
              className={`flex items-center gap-2 ${isDarkMode && !showPastEvents ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
            >
              <Calendar className="w-4 h-4" />
              {showPastEvents ? 'Hide Past Events' : 'Show Past Events'}
            </Button>
            
            {/* Manual refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshEvents}
              className={`flex items-center gap-2 ml-auto ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.5 12c0-4.14-3.36-7.5-7.5-7.5-2.98 0-5.56 1.75-6.77 4.25h2.02M4.5 12c0 4.14 3.36 7.5 7.5 7.5 2.98 0 5.56-1.75 6.77-4.25h-2.02" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Refresh
                </>
              )}
            </Button>
          </div>
        </AnimatedSection>
        
        {isLoading && !events.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="animate-pulse rounded-xl overflow-hidden">
                <div className={`h-48 ${isDarkMode ? 'bg-slate-800' : 'bg-muted'}`}></div>
                <div className="p-4 space-y-3">
                  <div className={`h-5 ${isDarkMode ? 'bg-slate-700' : 'bg-muted'} rounded w-3/4`}></div>
                  <div className={`h-4 ${isDarkMode ? 'bg-slate-700' : 'bg-muted'} rounded w-1/2`}></div>
                  <div className={`h-4 ${isDarkMode ? 'bg-slate-700' : 'bg-muted'} rounded w-full`}></div>
                  <div className={`h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-muted'} rounded w-1/3 mt-4`}></div>
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
            {isRefreshing && events.length > 0 && (
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