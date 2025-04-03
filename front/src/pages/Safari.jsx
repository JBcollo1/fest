import { Link } from 'react-router-dom';
import { Binoculars, Mountain, Tent, Compass, Sunrise, Map, Camera, Bird } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { Badge } from "@/components/ui/badge";

const SafariSection = () => {
  // Expanded safari types with 8 options
  const safariTypes = [
    {
      name: "Wildlife Safaris",
      description: "Track the Big Five in their natural habitats with expert guides",
      icon: <Binoculars className="h-8 w-8 mb-4" />,
      features: ["Game drives", "Night safaris", "Photography tours"],
      color: "bg-amber-500",
      backgroundImage: "url('https://media.istockphoto.com/id/1227486177/photo/mt-kilimanjaro-elephant-herd-tanzania-kenya-africa.jpg?s=612x612&w=0&k=20&c=wvg9fK91hJxZUCuS2gI84ou6KywoOmmWXS2m1sQj9XQ=')"
    },
    {
      name: "Mountain Treks",
      description: "Conquer peaks like Mount Kenya with certified mountain guides",
      icon: <Mountain className="h-8 w-8 mb-4" />,
      features: ["Technical climbs", "Scenic routes", "Equipment provided"],
      color: "bg-emerald-600",
      backgroundImage: "url('https://media.istockphoto.com/id/478924237/photo/african-lion-couple-and-safari-jeep.jpg?s=612x612&w=0&k=20&c=5_AFHVAd2GF2s51ZYtenE0NTKy5hiaofGjOtbjtHALI=')"
    },
    {
      name: "Luxury Camping",
      description: "Five-star wilderness experiences under African skies",
      icon: <Tent className="h-8 w-8 mb-4" />,
      features: ["Gourmet meals", "Private chefs", "Spa services"],
      color: "bg-indigo-600",
      backgroundImage: "url('https://media.istockphoto.com/id/2187548281/photo/hot-air-balloons-flying-over-a-campsite-in-the-african-savanna-at-sunrise-in-serengueti.jpg?s=612x612&w=0&k=20&c=dPHvq9xY2g1cKq2GIXvVqLSeLcm8UZ-yGw-8p8KRUh8=')"
    },
    {
      name: "Cultural Tours",
      description: "Connect with local communities and ancient traditions",
      icon: <Compass className="h-8 w-8 mb-4" />,
      features: ["Village visits", "Artisan workshops", "Traditional meals"],
      color: "bg-rose-600",
      backgroundImage: "url('https://media.istockphoto.com/id/1030408434/photo/rift-valley-landscape-kenya.jpg?s=612x612&w=0&k=20&c=9esAvijBAwhh-w1RU8jT9mPk-RAfhEqvuT4hKV03yAs=')"
    },
    {
      name: "Birdwatching",
      description: "Spot over 1,100 bird species in diverse ecosystems",
      icon: <Bird className="h-8 w-8 mb-4" />,
      features: ["Expert guides", "Specialized equipment", "Rare species"],
      color: "bg-sky-600",
      backgroundImage: "url('https://example.com/birdwatching.jpg')"
    },
    {
      name: "Photography",
      description: "Capture stunning landscapes and wildlife moments",
      icon: <Camera className="h-8 w-8 mb-4" />,
      features: ["Golden hour shoots", "Editing workshops", "Pro gear rental"],
      color: "bg-violet-600",
      backgroundImage: "url('https://example.com/photography-tour.jpg')"
    },
    {
      name: "Hot Air Balloon",
      description: "Aerial views of savannahs at sunrise",
      icon: <Sunrise className="h-8 w-8 mb-4" />,
      features: ["Champagne breakfast", "Pilot commentary", "Flight certificates"],
      color: "bg-orange-600",
      backgroundImage: "url('https://example.com/balloon-safari.jpg')"
    },
    {
      name: "Conservation",
      description: "Participate in wildlife protection efforts",
      icon: <Map className="h-8 w-8 mb-4" />,
      features: ["Rhino tracking", "Anti-poaching patrols", "Research projects"],
      color: "bg-lime-600",
      backgroundImage: "url('https://example.com/conservation.jpg')"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white" id="safari">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-amber-400 border-amber-400">
              Explore Kenya's Wonders
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              Diverse Safari Experiences
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Choose from 8 unique adventure categories, each offering unforgettable encounters with 
              Kenya's natural beauty and cultural heritage
            </p>
          </div>
        </AnimatedSection>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {safariTypes.map((safari, index) => (
              <AnimatedSection key={safari.name} delay={100 + index * 50}>
                <div className={`relative group rounded-xl overflow-hidden min-h-[400px] transition-all duration-300 hover:shadow-2xl ${safari.color}`}>
                  {/* Image container with gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10" />
                  
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: safari.backgroundImage ,
                      opacity: 0.5,
                      zIndex: -1 

                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-20 h-full flex flex-col justify-end p-6">
                    {safari.icon}
                    <h3 className="text-xl font-bold mb-2">{safari.name}</h3>
                    <p className="text-white/90 mb-4 text-sm">{safari.description}</p>
                    <ul className="space-y-1.5">
                      {safari.features.map((feature, i) => (
                        <li key={i} className="text-xs font-medium text-white/80 flex items-center">
                          <span className="mr-1.5">•</span> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={400}>
            <div className="mt-16 text-center">
              <Link 
                to="/safaris" 
                className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-full px-8 py-3 transition-colors"
              >
                Explore All 8 Safari Types
                {/* <ChevronRight className="h-4 w-4 ml-2" /> */}
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default SafariSection;