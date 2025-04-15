import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const Footer = () => {
    return(
      <footer className="bg-card py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-xl font-display font-semibold">FikaEvents</span>
              </div>
              <p className="text-muted-foreground">
                Discover and book events across Kenya.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">Browse Events</Link></li>
                <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/signin" className="text-muted-foreground hover:text-primary transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="text-muted-foreground hover:text-primary transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Locations</h3>
              <ul className="space-y-3">
                <li><Link to="/events?location=Nairobi" className="text-muted-foreground hover:text-primary transition-colors">Nairobi</Link></li>
                <li><Link to="/events?location=Mombasa" className="text-muted-foreground hover:text-primary transition-colors">Mombasa</Link></li>
                <li><Link to="/events?location=Kisumu" className="text-muted-foreground hover:text-primary transition-colors">Kisumu</Link></li>
                <li><Link to="/events?location=Nakuru" className="text-muted-foreground hover:text-primary transition-colors">Nakuru</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <address className="not-italic text-muted-foreground">
                <p>Westlands</p>
                <p>Nairobi, Kenya</p>
                <p className="mt-2">info@fikaevents.cm</p>
                <p>+254 700 000 000</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FikaEvents Kenya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
}
export default Footer