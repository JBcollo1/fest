
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AnimatedSection from '@/components/AnimatedSection';
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  TicketIcon, 
  Shield, 
  Star,
  Heart,
  Zap,
  Award,
  ArrowRight,
  Clock
} from 'lucide-react';

const About = () => {
  return (
    <div className="pt-20 min-h-screen bg-background flex flex-col">
     
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20">
        <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-r from-primary/30 to-secondary/30"></div>
        <div className="absolute inset-0 z-0">
          <div className="h-full w-full bg-gradient-pattern opacity-5"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <AnimatedSection>
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <span className="inline-block text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">Kenya's Premier Event Platform</span>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
                Your Gateway to <span className="text-gradient">Unforgettable</span> Experiences
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Connecting Kenyans to the events they love with seamless booking, secure transactions, and exceptional experiences.
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
              {[
                {
                  image: "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&q=80&w=1000",
                  category: "Concerts"
                },
                {
                  image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1000",
                  category: "Conferences"
                },
                {
                  image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000",
                  category: "Workshops"
                }
              ].map((item, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden group h-80">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300"></div>
                  <img 
                    src={item.image} 
                    alt={item.category} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-display font-bold">{item.category}</h3>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-10">
              <Button size="lg" asChild className="rounded-full text-base px-8 group">
                <Link to="/events">
                  Explore Events
                  <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Key Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 md:px-8">
          <AnimatedSection>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-5">
                Why Choose EventHub Kenya?
              </h2>
              <p className="text-muted-foreground text-lg">
                We've simplified event discovery and booking so you can focus on creating memories
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="h-8 w-8 text-primary" />,
                  title: "Secure Transactions",
                  description: "Every payment is protected with bank-level security and encryption"
                },
                {
                  icon: <Zap className="h-8 w-8 text-primary" />,
                  title: "Instant Delivery",
                  description: "Receive your tickets immediately after purchase via email or app"
                },
                {
                  icon: <CheckCircle className="h-8 w-8 text-primary" />,
                  title: "Verified Events",
                  description: "All events are carefully vetted to ensure quality and authenticity"
                },
                {
                  icon: <Calendar className="h-8 w-8 text-primary" />,
                  title: "Diverse Selection",
                  description: "From concerts to conferences, find the perfect event for you"
                },
                {
                  icon: <Clock className="h-8 w-8 text-primary" />,
                  title: "24/7 Support",
                  description: "Our dedicated team is always ready to assist with any questions"
                },
                {
                  icon: <TicketIcon className="h-8 w-8 text-primary" />,
                  title: "Easy Refunds",
                  description: "Hassle-free cancellation process if your plans change"
                }
              ].map((feature, index) => (
                <div key={index} className="glass rounded-xl p-8 h-full hover:shadow-lg transition-all duration-300 hover:translate-y-[-4px]">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <AnimatedSection>
            <div className="glass rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Our Story</h2>
                  <p className="text-lg leading-relaxed mb-6">
                    EventHub Kenya was born in 2023 out of a simple frustration: finding and booking tickets for local events was unnecessarily complicated.
                  </p>
                  <p className="text-lg leading-relaxed mb-6">
                    Our founder, Sarah Mwangi, missed a concert she was excited about because of a complicated booking process. She decided then that Kenya needed a simpler, more reliable way to connect people with experiences they love.
                  </p>
                  <p className="text-lg leading-relaxed mb-6">
                    Today, we're proud to be Kenya's fastest-growing event platform, helping thousands of people discover and attend events that create lasting memories.
                  </p>
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <Users className="text-primary h-5 w-5" />
                      <span className="font-semibold">10,000+ Users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-primary h-5 w-5" />
                      <span className="font-semibold">3,000+ Events</span>
                    </div>
                  </div>
                </div>
                <div className="relative h-full min-h-[400px]">
                  <img 
                    src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000" 
                    alt="Team working together" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent opacity-60"></div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-5">
                What Our Users Say
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Join thousands of satisfied users who've discovered their next favorite event through EventHub Kenya
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                {
                  name: "David Omondi",
                  role: "Music Enthusiast",
                  image: "https://randomuser.me/api/portraits/men/32.jpg",
                  quote: "EventHub made it so easy to discover local music events I never would have found otherwise. The booking process was smooth and the reminders were helpful!"
                },
                {
                  name: "Amina Hassan",
                  role: "Food Blogger",
                  image: "https://randomuser.me/api/portraits/women/44.jpg",
                  quote: "As someone who attends many food festivals, I appreciate how EventHub lets me filter events by category and location. It's become my go-to app for finding culinary experiences."
                },
                {
                  name: "John Kamau",
                  role: "Business Professional",
                  image: "https://randomuser.me/api/portraits/men/68.jpg",
                  quote: "The networking events I've found through EventHub have been game-changers for my career. The platform is intuitive and the ticket delivery is instant - exactly what busy professionals need."
                }
              ].map((testimonial, index) => (
                <div key={index} className="glass rounded-xl p-8 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="w-16 h-16 rounded-full object-cover border-4 border-white/20"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                      <p className="text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed italic">"{testimonial.quote}"</p>
                  <div className="flex mt-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Trust Signals */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-5">
                Trusted By
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We partner with Kenya's leading venues, event organizers, and brands
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center">
              {[
                "Kenya National Theatre",
                "Sarit Centre",
                "KICC",
                "Carnivore Nairobi",
                "Alchemist Bar",
                "The Hub Karen",
                "Two Rivers Mall",
                "Nairobi National Museum"
              ].map((partner, index) => (
                <div key={index} className="glass rounded-xl p-6 text-center h-24 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary mr-3" />
                  <span className="font-medium">{partner}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-20 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-pattern opacity-10"></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto">
              <Heart className="h-14 w-14 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                Ready to Experience the Best of Kenya?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Join thousands of Kenyans discovering and booking amazing events every day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="rounded-full text-base px-8">
                  <Link to="/events">Browse Events</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full text-base px-8">
                  <Link to="/signup">Create Account</Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default About;
