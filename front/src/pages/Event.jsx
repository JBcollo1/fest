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
  
  const fetchEvents = async (filters = {}) => {
    try {
      const cacheKey = JSON.stringify(filters);
      const now = Date.now();
      
      // Check if we have a valid cache entry
      if (eventsCache.current[cacheKey] && 
          now - eventsCache.current[cacheKey].timestamp < 300000) { // 5 minutes cache
        setEvents(eventsCache.current[cacheKey].data);
        return;
      }

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/events?${queryParams.toString()}`,
        { 
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      const eventsData = response.data.data;
      setEvents(eventsData);
      
      // Update cache with timestamp
      eventsCache.current[cacheKey] = {
        data: eventsData,
        timestamp: now
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
    }
  };

  useEffect(() => {
    // Cancel any pending requests when filter or search changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const timeoutId = setTimeout(() => {
      fetchEvents(filters);
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
    fetchEvents(filters);
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