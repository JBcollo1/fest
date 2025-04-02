import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AnimatedSection from '@/components/AnimatedSection';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'Discover Amazing Events',
      subtitle: 'Find and book tickets for the best events in Kenya'
    },
    {
      image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
      title: 'Experience Unforgettable Moments',
      subtitle: 'From music festivals to cultural celebrations'
    },
    {
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'Connect with Your Community',
      subtitle: 'Join thousands of event-goers across the country'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            width: '100%',
            height: '566px',
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.5)'
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row h-full min-h-[500px]">
        <div className="flex-1 flex flex-col justify-end p-6 md:p-10">
          <div className="w-full max-w-3xl animate-fade-in">
            <AnimatedSection>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
                {slides[currentSlide].title}
              </h1>
              <p className="text-white/90 text-base md:text-lg mb-8 max-w-2xl">
                {slides[currentSlide].subtitle}
              </p>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 mb-8">
                <Link to="/events">
                  <Ticket className="h-5 w-5 mr-2" />
                  Browse Events
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white w-6' : 'bg-white/50'
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;