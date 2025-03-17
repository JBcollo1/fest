import { Link } from 'react-router-dom';
import { Binoculars, Mountain, Tent } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { Badge } from "@/components/ui/badge";

const SafariSection = () => {
  // Safari types data
  const safariTypes = [
    {
      name: "Wildlife Safari",
      description: "Experience Kenya's iconic wildlife in their natural habitat",
      image: "https://media.istockphoto.com/id/478924237/photo/african-lion-couple-and-safari-jeep.jpg?s=612x612&w=0&k=20&c=5_AFHVAd2GF2s51ZYtenE0NTKy5hiaofGjOtbjtHALI="
    },
    {
      name: "Mountain Expeditions",
      description: "Trek through Kenya's majestic mountains and highlands",
      image: "https://media.istockphoto.com/id/1227486177/photo/mt-kilimanjaro-elephant-herd-tanzania-kenya-africa.jpg?s=612x612&w=0&k=20&c=wvg9fK91hJxZUCuS2gI84ou6KywoOmmWXS2m1sQj9XQ="
    },
    {
      name: "Camping Adventures",
      description: "Camp under the stars in Kenya's most beautiful locations",
      image: "https://media.istockphoto.com/id/2187548281/photo/hot-air-balloons-flying-over-a-campsite-in-the-african-savanna-at-sunrise-in-serengueti.jpg?s=612x612&w=0&k=20&c=dPHvq9xY2g1cKq2GIXvVqLSeLcm8UZ-yGw-8p8KRUh8="
    },
    {
      name: "Forest Explorations",
      description: "Discover the rich biodiversity of Kenya's ancient forests",
      image: "https://media.istockphoto.com/id/1030408434/photo/rift-valley-landscape-kenya.jpg?s=612x612&w=0&k=20&c=9esAvijBAwhh-w1RU8jT9mPk-RAfhEqvuT4hKV03yAs="
    }
  ];

  return (
    <section className="section-padding bg-secondary text-white">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Explore Kenyan Safaris</h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Experience the wonder of Kenya's wildlife and breathtaking landscapes with our curated safari adventures
            </p>
          </div>
        </AnimatedSection>
        
        <div className="window-size mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {safariTypes.map((safari, index) => (
              <AnimatedSection key={safari.name} delay={100 + index * 50}>
                <Link to={`/events?category=Safari&type=${safari.name}`} className="block">
                  <div className="glass rounded-xl p-0 text-center h-full card-hover bg-secondary relative" style={{ width: '512px', height: '512px' }}>
                    <img src={safari.image} alt={safari.name} className="w-full h-full object-cover rounded-xl"style={{ filter:'brightness(0.7)' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <h3 className="font-semibold text-lg">{safari.name}</h3>
                      <p className="text-sm text-white/70 mt-2" >
                        {safari.description}
                      </p>
                      
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafariSection;
