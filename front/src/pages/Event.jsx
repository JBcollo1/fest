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
  // Refs
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const autoRetryTimeoutRef = useRef(null);
  const eventsCache = useRef({});
  const lastFetchParams = useRef(null);
  const lastPastEventsState = useRef(false);
  const initialRenderComplete = useRef(false);
  
  // Config
  const maxAutoRetries = 3;
  
  // Router
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  
  // State
  const [filterState, setFilterState] = useState({
    activeFilter: 'all',
    searchQuery: '',
    selectedLocation: '',
    showPastEvents: false,
    additionalFilters: {
      category: '',
      date: '',
      price: ''
    }
  });
  
  const [uiState, setUiState] = useState({
    isLoading: true,
    isRefreshing: false,
    isAutoRetrying: false,
    showFilters: false,
    error: null,
    retryCount: 0,
    emptyResultsRetryCount: 0
  });
  
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Extract from state for easier reference
  const { activeFilter, searchQuery, selectedLocation, showPastEvents, additionalFilters } = filterState;
  const { isLoading, isRefreshing, isAutoRetrying, error, emptyResultsRetryCount } = uiState;
  
  // Process URL parameters and location state
  useEffect(() => {
    const searchFromUrl = searchParams.get('query');
    const categoryFromUrl = searchParams.get('category');
    const locationFromUrl = searchParams.get('location');
    const locationFromState = location.state?.location;
    const searchFromState = location.state?.searchParams;
    
    // Collect all parameters that should update state
    const stateUpdates = {};
    
    // Handle search parameters from state (highest priority)
    if (searchFromState) {
      if (searchFromState.query) stateUpdates.searchQuery = searchFromState.query;
      if (searchFromState.category) stateUpdates.activeFilter = searchFromState.category;
      if (searchFromState.location) stateUpdates.selectedLocation = searchFromState.location;
    } 
    // Handle URL parameters
    else {
      if (searchFromUrl) stateUpdates.searchQuery = searchFromUrl;
      if (categoryFromUrl) stateUpdates.activeFilter = categoryFromUrl;
      if (locationFromUrl) stateUpdates.selectedLocation = locationFromUrl;
      else if (locationFromState) stateUpdates.selectedLocation = locationFromState;
    }
    
    // Only update state if we have changes
    if (Object.keys(stateUpdates).length > 0) {
      setFilterState(prev => ({
        ...prev,
        ...stateUpdates
      }));
    }
  }, [searchParams, location.state]);
  
  // Fetch categories once
  useEffect(() => {
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
    
    fetchCategories();
  }, []);
  
  // Create a cache key from filters
  const createCacheKey = useCallback(() => {
    return JSON.stringify({
      activeFilter,
      searchQuery,
      selectedLocation,
      additionalFilters,
      showPastEvents
    });
  }, [activeFilter, searchQuery, selectedLocation, additionalFilters, showPastEvents]);

  // Handle auto-retry for empty results
  const handleEmptyResultsRetry = useCallback(() => {
    if (!mountedRef.current || uiState.emptyResultsRetryCount >= maxAutoRetries) return;
    
    setUiState(prev => ({
      ...prev,
      isAutoRetrying: true,
      isLoading: true
    }));
    
    // Clear any existing timeout
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
    }
    
    // Exponential backoff for retries (500ms, 1000ms, 2000ms)
    const retryDelay = Math.min(500 * Math.pow(2, uiState.emptyResultsRetryCount), 2000);
    
    console.log(`Auto-retrying fetch for empty results (attempt ${uiState.emptyResultsRetryCount + 1}/${maxAutoRetries}) in ${retryDelay}ms`);
    
    autoRetryTimeoutRef.current = setTimeout(() => {
      setUiState(prev => ({
        ...prev,
        emptyResultsRetryCount: prev.emptyResultsRetryCount + 1
      }));
      fetchEvents(true); // Force refresh to bypass cache
    }, retryDelay);
    
  }, [uiState.emptyResultsRetryCount]);

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current) return;

    console.log('fetchEvents called with filters:', filterState);

    // Build query params for cache key
    const cacheKey = createCacheKey();
    
    // Special handling for showPastEvents toggle to prevent cache issues
    // Don't use cache when toggling showPastEvents to ensure fresh data
    const isPastEventsToggle = lastPastEventsState.current !== showPastEvents;
    const shouldUseCache = !forceRefresh && !isPastEventsToggle && eventsCache.current[cacheKey];
    
    // Update the last state after checking
    lastPastEventsState.current = showPastEvents;
    
    // Check if we have cached data and aren't forcing a refresh
    if (shouldUseCache) {
      setEvents(eventsCache.current[cacheKey]);
      setUiState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        isAutoRetrying: false
      }));
      return;
    }
    
    // If we're refreshing current data, show refreshing state instead of loading
    if (events.length > 0 && !forceRefresh && !uiState.isAutoRetrying) {
      setUiState(prev => ({
        ...prev,
        isRefreshing: true,
        error: null
      }));
    } else {
      setUiState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
    }
    
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
      
      // Add show_past parameter (use explicit true/false string)
      queryParams.append('show_past', showPastEvents === true ? 'true' : 'false');
      
      // Add additional filters
      Object.entries(additionalFilters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      console.log(`Fetching events from: ${import.meta.env.VITE_API_URL}/api/events?${queryParams.toString()}`);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/events?${queryParams.toString()}`,
        { 
          withCredentials: true,
          headers: {
            // Add Cache-Control header to prevent browser caching for showPastEvents toggle
            ...(isPastEventsToggle ? { 'Cache-Control': 'no-cache' } : {})
          }
        }
      );

      if (!mountedRef.current) return;

      console.log('API Response:', response.data);

      // Handle different potential response structures
      let fetchedEvents = [];
      
      if (Array.isArray(response.data)) {
        // If response.data is an array, use it directly
        fetchedEvents = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        // If response.data.data is an array
        fetchedEvents = response.data.data;
      } else if (response.data && response.data[0] && response.data[0].data) {
        // Original structure expected
        fetchedEvents = response.data[0].data;
      } else if (response.data && typeof response.data === 'object') {
        // If data is an object with direct event properties
        fetchedEvents = [response.data];
      }
      
      // Ensure fetchedEvents is always an array
      if (!Array.isArray(fetchedEvents)) {
        console.error('Unexpected API response format:', response.data);
        fetchedEvents = [];
      }
      
      // Update cache with new data
      eventsCache.current[cacheKey] = fetchedEvents;
      
      // Only update state if this is still the most recent request
      if (lastFetchParams.current === cacheKey) {
        setEvents(fetchedEvents);
        
        // Only retry for empty results if we're not specifically looking for past events
        // (since it's normal to have no past events in some locations)
        if (fetchedEvents.length === 0 && uiState.emptyResultsRetryCount < maxAutoRetries && 
            !(showPastEvents && selectedLocation)) {
          handleEmptyResultsRetry();
          return; // Keep loading state active by returning early
        } else {
          // Reset retry count when we get results or exceed max retries
          setUiState(prev => ({
            ...prev,
            emptyResultsRetryCount: 0,
            isAutoRetrying: false,
            isLoading: false,
            isRefreshing: false
          }));
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error fetching events:', error);
      
      setUiState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to load events. Please try again later.',
        isAutoRetrying: false,
        isLoading: false,
        isRefreshing: false
      }));
    }
  }, [activeFilter, searchQuery, selectedLocation, additionalFilters, showPastEvents, events.length, uiState.emptyResultsRetryCount, uiState.isAutoRetrying, createCacheKey, handleEmptyResultsRetry]);

  // Cleanup function
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, []);

  // Initial data fetch - trigger once after first render
  useEffect(() => {
    // Initial data fetch
    fetchEvents();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Empty dependency array means this runs once on mount

  // Effect for filter changes
  useEffect(() => {
    // Skip the very first render since we have a dedicated effect for initial fetch
    if (!initialRenderComplete.current) {
      initialRenderComplete.current = true;
      return;
    }
    
    console.log('Filter change detected, preparing to fetch events');
    
    // Cancel any pending requests when filter or search changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Clear any auto-retry timeout
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
    }
    
    // Reset auto-retry count on filter changes
    setUiState(prev => ({
      ...prev,
      emptyResultsRetryCount: 0,
      isAutoRetrying: false
    }));
    
    // Debounce all searches to prevent too many API calls
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, searchQuery ? 500 : 200); // Add a small delay even without search query
    
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, [activeFilter, searchQuery, selectedLocation, additionalFilters, showPastEvents, fetchEvents]);

  // Add a refresh function that forces bypass of cache
  const refreshEvents = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Reset auto-retry count on manual refresh
    setUiState(prev => ({
      ...prev,
      emptyResultsRetryCount: 0,
      isAutoRetrying: false
    }));
    
    fetchEvents(true); // Force refresh
  }, [fetchEvents]);

  // Add a retry mechanism
  const handleRetry = useCallback(() => {
    // Reset retry count on manual retry
    setUiState(prev => ({
      ...prev,
      emptyResultsRetryCount: 0,
      isAutoRetrying: false,
      retryCount: prev.retryCount + 1
    }));
    
    refreshEvents();
  }, [refreshEvents]);

  const handleSearch = useCallback((searchParams) => {
    setFilterState(prev => ({
      ...prev,
      searchQuery: searchParams.query || '',
      activeFilter: searchParams.category || prev.activeFilter,
      selectedLocation: searchParams.location || ''
    }));
  }, []);

  const handleFilterClick = useCallback((filter) => {
    setFilterState(prev => ({
      ...prev,
      activeFilter: filter,
      searchQuery: '', 

      ...(filter === 'all' ? { selectedLocation: '' } : {})
    }));
  }, []);

  // Add toggle for past events
  const togglePastEvents = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      showPastEvents: !prev.showPastEvents
    }));
    
  }, []);

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
              disabled={isLoading || isRefreshing || isAutoRetrying}
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
              disabled={isRefreshing || isAutoRetrying}
            >
              {isRefreshing || isAutoRetrying ? (
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
            {uiState.retryCount < 3 ? (
              <p className="text-muted-foreground mb-4">
                Retrying in {Math.min(1000 * Math.pow(2, uiState.retryCount), 10000) / 1000} seconds...
              </p>
            ) : (
              <Button onClick={handleRetry} className="mt-4">Try Again</Button>
            )}
          </div>
        ) : (
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <EventCard key={event.id || `event-${event.title}`} event={event} />
                ))
              ) : (
                <div className="col-span-3 text-center py-10">
                  <h3 className="text-xl font-medium mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-6">
                    {showPastEvents ? 
                      "No past events found for this selection. Try changing your filter or location." :
                      "Try changing your filter or search criteria"}
                  </p>
                  <Button onClick={() => handleFilterClick('all')}>View All Events</Button>
                </div>
              )}
            </div>
            {isRefreshing && events.length > 0 && (
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">Refreshing results...</p>
              </div>
            )}
            {isAutoRetrying && (
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">Looking for events...</p>
              </div>
            )}
          </AnimatedSection>
        )}
      </section>
    </div>
  );
};

export default Events;