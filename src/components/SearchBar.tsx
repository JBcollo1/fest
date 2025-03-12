
import { useState } from 'react';
import { Search, Calendar, MapPin, Filter } from 'lucide-react';
import { categories, locations } from '@/utils/data';
import { Button } from "@/components/ui/button";

const SearchBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      query: searchQuery,
      category: selectedCategory,
      location: selectedLocation,
      date: selectedDate
    });
    // In a real app, this would trigger a search or update URL params
  };

  return (
    <div className={`glass rounded-xl transition-all duration-300 overflow-hidden w-full max-w-4xl mx-auto ${isExpanded ? 'shadow-lg' : ''}`}>
      <form onSubmit={handleSearch} className="w-full">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 flex items-center p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
            <Search className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full bg-transparent border-none focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
          
          {isExpanded && (
            <>
              <div className="flex-1 flex items-center p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none placeholder:text-muted-foreground"
                />
              </div>
              
              <div className="flex-1 flex items-center p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <MapPin className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">All locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 flex items-center p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <Filter className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none appearance-none cursor-pointer"
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleExpand}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? 'Less' : 'More'}
            </Button>
            
            <Button type="submit" className="rounded-full">
              Search
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
