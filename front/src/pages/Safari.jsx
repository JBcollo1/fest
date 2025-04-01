import { Link } from 'react-router-dom';
import { Binoculars, Mountain, Tent, Compass } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { Badge } from "@/components/ui/badge";

const SafariSection = () => {
  // Safari types data with improved descriptions and icons
  const safariTypes = [
    {
      name: "Wildlife Safari",
      description: "Witness the majestic Big Five and experience the Great Migration up close",
      icon: <Binoculars className="h-8 w-8 mb-4" />,
      features: ["Game drives", "Professional guides", "Photography spots"],
      color: "bg-amber-500",
      backgroundImage: "url('https://media.istockphoto.com/id/1227486177/photo/mt-kilimanjaro-elephant-herd-tanzania-kenya-africa.jpg?s=612x612&w=0&k=20&c=wvg9fK91hJxZUCuS2gI84ou6KywoOmmWXS2m1sQj9XQ=')"
    },
    {
      name: "Mountain Expeditions",
      description: "Conquer Mount Kenya and explore breathtaking highlands with expert guides",
      icon: <Mountain className="h-8 w-8 mb-4" />,
      features: ["Trained mountaineers", "Equipment provided", "Multiple routes"],
      color: "bg-emerald-600",
      backgroundImage: "url('https://media.istockphoto.com/id/478924237/photo/african-lion-couple-and-safari-jeep.jpg?s=612x612&w=0&k=20&c=5_AFHVAd2GF2s51ZYtenE0NTKy5hiaofGjOtbjtHALI=')"
    },
    {
      name: "Camping Adventures",
      description: "Sleep under star-filled African skies in luxury glamping accommodations",
      icon: <Tent className="h-8 w-8 mb-4" />,
      features: ["Luxury tents", "Chef-prepared meals", "Campfire stories"],
      color: "bg-indigo-600",
      backgroundImage:"url(https://media.istockphoto.com/id/2187548281/photo/hot-air-balloons-flying-over-a-campsite-in-the-african-savanna-at-sunrise-in-serengueti.jpg?s=612x612&w=0&k=20&c=dPHvq9xY2g1cKq2GIXvVqLSeLcm8UZ-yGw-8p8KRUh8=)"
    },
    {
      name: "Forest Explorations",
      description: "Discover ancient forests with incredible biodiversity and cultural heritage",
      icon: <Compass className="h-8 w-8 mb-4" />,
      features: ["Bird watching", "Indigenous guides", "Hidden waterfalls"],
      color: "bg-rose-600",
      backgroundImage:"url(https://media.istockphoto.com/id/1030408434/photo/rift-valley-landscape-kenya.jpg?s=612x612&w=0&k=20&c=9esAvijBAwhh-w1RU8jT9mPk-RAfhEqvuT4hKV03yAs=)"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white" id="safari">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-amber-400 border-amber-400">Unforgettable Experiences</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Discover Safari Kenya</h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Embark on extraordinary journeys through Kenya's diverse landscapes, from savannah plains to mountain peaks
            </p>
          </div>
        </AnimatedSection>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safariTypes.map((safari, index) => (
              <AnimatedSection key={safari.name} delay={100 + index * 75}>
                <div
                  className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 flex flex-col ${safari.color}`}
                >
                  {/* Background image with reduced opacity */}
                  <div className="absolute inset-0 rounded-2xl" style={{
                    backgroundImage: safari.backgroundImage,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.5, // Adjusted opacity for the background image
                    zIndex: -1 // Ensure it stays behind other content
                  }}></div>
                  
                  <div className="relative flex items-center justify-center z-10">
                    {safari.icon}
                  </div>
                  
                  <h3 className="relative font-bold text-xl mb-3 z-10"
                  style={{opacity: 0.9,}}
                  >{safari.name}</h3>
                  <p className="relative text-white/80 mb-6 flex-grow z-10">
                    {safari.description}
                  </p>
                  
                  <ul className="relative mb-6 space-y-2 z-10">
                    {safari.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-white/60">
                        <span className="mr-2">•</span> {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Removed Explore button */}
                </div>
              </AnimatedSection>
            ))}
          </div>
          
          <AnimatedSection delay={400}>
            <div className="mt-16 text-center">
              <Link 
                to="/safaris" 
                className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-full px-8 py-3 transition-colors"
              >
                View All Safari Experiences
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default SafariSection;