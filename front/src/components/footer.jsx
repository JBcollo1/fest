import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { categories } from '@/utils/data';
const Footer = () =>{
    return(
        <footer className="bg-card py-12 px-4">

<div className="container mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-6 w-6 text-primary" />
        <span className="text-xl font-display font-semibold">EventHub</span>
      </div>
      <p className="text-muted-foreground">
        Your premier platform for discovering and booking events across Kenya.
      </p>
    </div>
    
    <div>
      <h3 className="font-semibold mb-4">Quick Links</h3>
      <ul className="space-y-3">
        <li><Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">Browse Events</Link></li>
        <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
        <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
        <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQs</Link></li>
      </ul>
    </div>
    
    <div>
      <h3 className="font-semibold mb-4">Categories</h3>
      <ul className="space-y-3">
        {categories.filter(c => c !== 'All').slice(0, 4).map(category => (
          <li key={category}>
            <Link to={`/events?category=${category}`} className="text-muted-foreground hover:text-primary transition-colors">
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </div>
    
    <div>
      <h3 className="font-semibold mb-4">Contact Us</h3>
      <address className="not-italic text-muted-foreground">
        <p>Westlands </p>
        <p>Nairobi, Kenya</p>
        <p className="mt-2">info@fikaevent.co.ke</p>
        <p>+254 700 123 456</p>
      </address>
    </div>
  </div>
  
  <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
    <p>&copy; {new Date().getFullYear()} EventHub Kenya. All rights reserved.</p>
  </div>
</div>
</footer>
    )
}
export default Footer