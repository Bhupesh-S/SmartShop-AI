
export const products = [
  {
    id: 1,
    name: 'Aura Wireless Headphones',
    price: 199.99,
    description: 'Experience immersive sound with these noise-cancelling wireless headphones. Feather-light design for all-day comfort and a 30-hour battery life to keep the music going.',
    image: 'https://picsum.photos/seed/product1/600/600',
    category: 'Electronics',
    reviews: [
      { id: 1, author: 'Alex D.', rating: 5, text: 'Absolutely phenomenal sound quality! The noise cancellation is top-notch. Worth every penny.', date: '2024-07-15' },
      { id: 2, author: 'Ben K.', rating: 4, text: 'Great headphones, very comfortable. The battery lasts forever. Only downside is the case feels a bit cheap.', date: '2024-07-10' },
      { id: 3, author: 'Maria G.', rating: 5, text: 'Compré estos para mi viaje y fueron increíbles. ¡El sonido es claro y la cancelación de ruido es un salvavidas en los aviones!', date: '2024-07-05' },
    ],
  },
  {
    id: 2,
    name: 'Terra Smart Watch',
    price: 249.50,
    description: 'Stay connected and track your fitness goals with the Terra Smart Watch. Features a vibrant AMOLED display, heart rate monitoring, and seamless smartphone integration.',
    image: 'https://picsum.photos/seed/product2/600/600',
    category: 'Wearables',
    reviews: [
      { id: 4, author: 'Chris P.', rating: 5, text: 'This watch is a game-changer. The screen is so bright and responsive. Fitness tracking is accurate and motivates me daily.', date: '2024-07-20' },
      { id: 5, author: 'Anonymous', rating: 2, text: 'Bad product. Broke after a week. Not good.', date: '2024-07-18' },
    ],
  },
  {
    id: 3,
    name: 'Flow Mechanical Keyboard',
    price: 120.00,
    description: 'Elevate your typing experience. The Flow Mechanical Keyboard features custom switches for a satisfying tactile feel, full RGB backlighting, and a durable aluminum frame.',
    image: 'https://picsum.photos/seed/product3/600/600',
    category: 'Computer Accessories',
    reviews: [
      { id: 6, author: 'Jordan T.', rating: 5, text: 'As a developer, I type all day, and this keyboard is a dream. The clicky sound is so satisfying!', date: '2024-06-30' },
      { id: 7, author: 'Samantha B.', rating: 4, text: 'Le clavier est fantastique, mais le logiciel pour contrôler l\'éclairage RVB est un peu bogué.', date: '2024-06-25' },
    ],
  },
  {
    id: 4,
    name: 'Orbit Streaming Webcam',
    price: 89.99,
    description: 'Crystal-clear 1080p video at 60fps. The Orbit Webcam is perfect for streaming, video conferencing, and online content creation, with an integrated ring light for perfect lighting.',
    image: 'https://picsum.photos/seed/product4/600/600',
    category: 'Computer Accessories',
    reviews: [
      { id: 8, author: 'Mikey', rating: 5, text: 'Wow, this is an amazing product. The video quality is insane. I recommend it to everyone. You should definitely buy it. 10/10.', date: '2024-07-21' },
      { id: 9, author: 'Lee W.', rating: 4, text: 'Good camera for the price. The ring light is a nice touch, although not powerful enough for all situations.', date: '2024-07-12' },
    ],
  },
    {
    id: 5,
    name: 'Zenith Ergonomic Chair',
    price: 350.00,
    description: 'Support your back during long work sessions with the Zenith Ergonomic Chair. Fully adjustable lumbar support, armrests, and a breathable mesh back keep you comfortable and focused.',
    image: 'https://picsum.photos/seed/product5/600/600',
    category: 'Office',
    reviews: [],
  },
  {
    id: 6,
    name: 'Nomad Travel Backpack',
    price: 95.00,
    description: 'The perfect companion for your adventures. The Nomad Backpack is made from water-resistant materials, with dedicated compartments for your laptop, camera, and essentials.',
    image: 'https://picsum.photos/seed/product6/600/600',
    category: 'Travel',
    reviews: [
      { id: 10, author: 'Eva K.', rating: 5, text: 'Took this backpack across Europe and it was perfect. Held everything I needed and was comfortable to carry all day.', date: '2024-07-19' },
    ],
  }
];

export const getProductById = (id) => products.find(p => p.id === id);