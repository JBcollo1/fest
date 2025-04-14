import React from 'react';
import { BookCheck, Globe, Users, Rocket } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
// const CurveTop = ({ fill }) => (
//   <div className="relative -top-1">
//     <svg viewBox="0 0 1440 160" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M1440 31.21V160H0V31.21C120 42.93 480 54.65 720 25.47C960 -3.71 1320 -23.9 1440 31.21Z" fill={fill}/>
//     </svg>
//   </div>
// );

// const CurveBottom = ({ fill }) => (
//   <div className="relative -bottom-1">
//     <svg viewBox="0 0 1440 160" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M0 128.79V0H1440V128.79C1320 117.07 960 105.35 720 134.53C480 163.71 120 183.9 0 128.79Z" fill={fill}/>
//     </svg>
//   </div>
// );
const About = () => {
  const { isDarkMode } = useTheme();

  const services = [
    {
      icon: <BookCheck className="w-12 h-12 text-primary" />,
      title: 'Event Promotion',
      description: 'Tailored marketing strategies to maximize event visibility through social media, email marketing, and influencer partnerships.'
    },
    {
      icon: <Globe className="w-12 h-12 text-secondary" />,
      title: 'Ticket Sales',
      description: 'User-friendly online ticketing platform with secure payment processing, real-time tracking, and mobile QR code integration.'
    },
    {
      icon: <Users className="w-12 h-12 text-accent" />,
      title: 'Crowd Management',
      description: 'Advanced crowd control solutions ensuring safety, comfort, and optimized crowd flow with real-time monitoring.'
    },
    {
      icon: <Rocket className="w-12 h-12 text-primary-foreground" />,
      title: 'Event Planning Support',
      description: 'Comprehensive support including venue selection, vendor management, logistics coordination, and post-event analysis.'
    }
  ];

  const targetMarkets = [
    'Event Organizers',
    'Artists & Performers',
    'Sports Teams',
    'Festivals',
    'Venues'
  ];

  return (
    <div className="text-foreground">
      {/* Hero Section */}
      <div 
        className="text-primary-foreground pt-24 md:pt-32 mb-8 md:mb-16 px-4 sm:px-6 lg:px-8"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
          minHeight: '65vh'
        }}
      >
        <div className='pt-8 md:pt-12'>
          <div className="max-w-7xl mx-auto text-center space-y-6"> 
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Fika Event Solutions</h1>
            <p className="text-2xl md:text-4xl mb-8 max-w-3xl mx-auto leading-tight ">
              We Make Experience Out Of Events!
            </p>
            <p className="text-lg md:text-xl mb-12 max-w-4xl mx-auto">
              A cutting-edge event management platform that transforms experiences through innovative technology and expert planning.
            </p>
            <div className='mt-8'>
              <a 
                href="#services" 
                className="inline-block hover:bg-opacity-90 px-8 py-3 md:px-12 md:py-4 rounded-full font-semibold transition duration-300 text-lg bg-accent text-accent-foreground"
              >
                Explore Our Services
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* <CurveBottom fill={colors.darkBlue} /> */}

      {/* About Overview */}
      <div className="pt-20 md:pt-28 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-primary">
          About Fika Innovations Group Ltd.
        </h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 max-w-2xl">
            <p className="text-lg leading-relaxed">
              Fika Event Solutions is revolutionizing the event industry by providing end-to-end solutions that connect people with unforgettable experiences.
            </p>
            <p className="text-lg leading-relaxed">
              We combine cutting-edge technology with expert event planning to deliver seamless, memorable events for organizers and attendees alike.
            </p>
          </div>
          <div className="p-8 rounded-xl shadow-lg max-w-xl w-full bg-accent/10 dark:bg-accent/20">
            <h3 className="text-2xl font-semibold mb-6 text-primary">
              Our Core Values
            </h3>
            <ul className="space-y-4">
              {['Innovation in Event Management', 'Customer-Centric Approach', 'Technological Empowerment', 'Comprehensive Solutions'].map((value, index) => (
                <li key={index} className="flex items-start text-lg">
                  <span className="mr-3 mt-1 text-primary">✓</span>
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* <CurveTop fill="#ffffff" /> */}

      {/* Services Section */}
      <div 
        id="services" 
        className="pt-20 md:pt-28 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 bg-secondary/10 dark:bg-secondary/20"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-primary">
            Our Core Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 space-y-4 bg-card text-card-foreground border border-border"
              >
                <div className="flex justify-center">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-primary">
                  {service.title}
                </h3>
                <p className="leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* <CurveBottom fill="#001D3D1A" /> */}

      {/* Target Markets */}
      <div className='min-h-[350px]'>
        <div className="pt-20 md:pt-28 pb-18 md:pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-primary">
              Markets We Serve
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {targetMarkets.map((market, index) => (
                <div 
                  key={index} 
                  className="px-6 py-3 rounded-full font-medium text-sm md:text-base text-center bg-accent/40 dark:bg-accent/70 text-accent-foreground"
                >
                  {market}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* <CurveTop fill="#ffffff" /> */}

      {/* Mission and Vision */}
      <div 
        className="text-primary-foreground pt-20 md:pt-28 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
          minHeight: '500px'
        }}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-background/10 dark:bg-background/20 p-10 rounded-xl space-y-6">
            <h3 className="text-2xl font-bold ">
              Our Mission
            </h3>
            <p className="text-lg leading-relaxed">
              To revolutionize the event industry by providing innovative, reliable, and comprehensive solutions that empower organizers and delight attendees.
            </p>
          </div>
          <div className="bg-background/10 dark:bg-background/20 p-10 rounded-xl space-y-6">
            <h3 className="text-2xl font-bold ">
              Our Vision
            </h3>
            <p className="text-lg leading-relaxed">
              To become the global leader in event management and ticketing, connecting people through unforgettable experiences.
            </p>
          </div>
        </div>
      </div>

      {/* <CurveTop fill={colors.darkBlue} /> */}

      {/* Call to Action */}
      <div className="pt-20 md:pt-28 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 bg-accent/10 dark:bg-accent/20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">
            Ready to Make Your Event Count?
          </h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto">
            Let Fika Event Solutions transform your next event from ordinary to extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <a 
              href="mailto:info@fikaevents.co.ke" 
              className="inline-block hover:bg-opacity-90 px-8 py-3 rounded-full transition duration-300 text-lg bg-primary text-primary-foreground"
            >
              Contact Us
            </a>
            <a 
              href="https://fikaevents.co.ke" 
              className="inline-block border-2 px-8 py-3 rounded-full hover:bg-opacity-10 transition duration-300 text-lg border-primary text-primary"
            >
              Explore Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;