
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  featured: boolean;
  tickets_available: number;
  organizer: {
    name: string;
    image: string;
  };
}

export const eventsData: Event[] = [
  {
    id: "e1",
    title: "Nairobi Music Festival",
    description: "The biggest music festival in East Africa, featuring top local and international artists across three stages.",
    date: "2023-07-15",
    time: "12:00 PM",
    location: "Uhuru Gardens, Nairobi",
    price: 3000,
    currency: "KES",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    category: "Music",
    featured: true,
    tickets_available: 250,
    organizer: {
      name: "Kenya Events Ltd",
      image: "https://randomuser.me/api/portraits/men/1.jpg"
    }
  },
  {
    id: "e2",
    title: "Maasai Mara Safari Experience",
    description: "A 3-day guided tour of the Maasai Mara National Reserve during the great wildebeest migration.",
    date: "2023-08-10",
    time: "06:00 AM",
    location: "Maasai Mara, Kenya",
    price: 15000,
    currency: "KES",
    image: "https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
    category: "Adventure",
    featured: true,
    tickets_available: 30,
    organizer: {
      name: "Safari Adventures",
      image: "https://randomuser.me/api/portraits/women/2.jpg"
    }
  },
  {
    id: "e3",
    title: "Tech Summit Nairobi",
    description: "Connect with tech leaders, innovators, and investors from across Africa and beyond.",
    date: "2023-09-05",
    time: "09:00 AM",
    location: "KICC, Nairobi",
    price: 5000,
    currency: "KES",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    category: "Technology",
    featured: true,
    tickets_available: 120,
    organizer: {
      name: "TechHub Kenya",
      image: "https://randomuser.me/api/portraits/men/3.jpg"
    }
  },
  {
    id: "e4",
    title: "Diani Beach Cultural Festival",
    description: "Experience Swahili culture through music, dance, food, and crafts on the beautiful Diani Beach.",
    date: "2023-07-22",
    time: "10:00 AM",
    location: "Diani Beach, Mombasa",
    price: 1000,
    currency: "KES",
    image: "https://images.unsplash.com/photo-1589383890216-a2e67309acb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
    category: "Cultural",
    featured: false,
    tickets_available: 200,
    organizer: {
      name: "Coastal Events",
      image: "https://randomuser.me/api/portraits/women/4.jpg"
    }
  },
  {
    id: "e5",
    title: "Nairobi Food Festival",
    description: "Sample delicious cuisines from Kenya and around the world, with cooking demonstrations and competitions.",
    date: "2023-08-19",
    time: "11:00 AM",
    location: "Carnivore Gardens, Nairobi",
    price: 2500,
    currency: "KES",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
    category: "Food & Drink",
    featured: false,
    tickets_available: 180,
    organizer: {
      name: "Taste of Kenya",
      image: "https://randomuser.me/api/portraits/men/5.jpg"
    }
  },
  {
    id: "e6",
    title: "Kenyan Fashion Week",
    description: "The premier fashion event in East Africa showcasing the best of Kenyan and African design talent.",
    date: "2023-09-15",
    time: "06:00 PM",
    location: "Radisson Blu, Nairobi",
    price: 7500,
    currency: "KES",
    image: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80",
    category: "Fashion",
    featured: false,
    tickets_available: 100,
    organizer: {
      name: "Fashion Kenya",
      image: "https://randomuser.me/api/portraits/women/6.jpg"
    }
  }
];

export const categories = [
  "All",
  "Music",
  "Adventure",
  "Technology",
  "Cultural",
  "Food & Drink",
  "Fashion",
  "Sports",
  "Business",
  "Art"
];

export const locations = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret"
];
