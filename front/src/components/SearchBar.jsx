import { useState, useCallback } from 'react';
import { Search, Calendar, MapPin, Filter, X } from 'lucide-react';
import { categories, locations } from '@/utils/data';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const SearchBar = ({ onSearch, initialQuery = '', initialCategory = 'All', initialLocation = '', initialDate = '', showFilters = true }) => {
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const navigate = useNavigate();

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    
    const searchParams = {
      query: searchQuery.trim(),
      category: selectedCategory !== 'All' ? selectedCategory : '',
      location: selectedLocation,
      date: selectedDate
    };

    // Only include non-empty values
    const finalParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value)
    );

    if (onSearch) {
      onSearch(finalParams);
    } else {
      navigate('/events', { 
        state: { 
          searchParams: finalParams 
        }
      });
    }
  }, [searchQuery, selectedCategory, selectedLocation, selectedDate, onSearch, navigate]);

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('');
    setSelectedDate('');
    if (onSearch) {
      onSearch({});
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setSelectedLocation(newLocation);
    // Trigger search immediately when location changes
    handleSearch();
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className={`glass rounded-xl transition-all duration-300 overflow-hidden w-full max-w-4xl mx-auto ${isExpanded ? 'shadow-lg' : ''} ${isDarkMode ? 'bg-slate-900/90 border border-slate-800' : ''}`}>
        <form onSubmit={handleSearch} className="w-full">
          <div className="flex flex-col md:flex-row">
            <div className={`flex-1 flex items-center p-4 border-b md:border-b-0 md:border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <Search className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search events by title, description, location..."
                className={`w-full bg-transparent border-none focus:outline-none placeholder:text-muted-foreground ${isDarkMode ? 'text-white' : ''}`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {showFilters && isExpanded && (
              <>
                <div className={`flex-1 flex items-center p-4 border-b md:border-b-0 md:border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <Calendar className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className={`w-full bg-transparent border-none focus:outline-none placeholder:text-muted-foreground ${isDarkMode ? 'text-white' : ''}`}
                  />
                </div>
                
                <div className={`flex-1 flex items-center p-4 border-b md:border-b-0 md:border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <MapPin className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                  <select
                    value={selectedLocation}
                    onChange={handleLocationChange}
                    className={`w-full bg-transparent border-none focus:outline-none appearance-none cursor-pointer ${isDarkMode ? 'text-white' : ''}`}
                  >
                    <option value="">All locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={`flex-1 flex items-center p-4 border-b md:border-b-0 md:border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <Filter className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className={`w-full bg-transparent border-none focus:outline-none appearance-none cursor-pointer ${isDarkMode ? 'text-white' : ''}`}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            <div className="flex items-center p-3 space-x-2">
              {showFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="md:hidden"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  {isExpanded ? 'Less' : 'More'}
                </Button>
              )}
              
              <Button type="submit" className="rounded-full">
                Search
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchBar;