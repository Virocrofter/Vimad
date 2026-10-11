/* src/app/guest-portal/data.js */

/* ─── Guest Profile ─── */
export const guestProfile = {
  id: 'G-1001',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@email.com',
  phone: '+1555-0101',
  avatar: 'https://cdn.vimad.io/avatars/g-1001.jpg',
  language: 'en',
  currency: 'ZAR',
  tier: 'gold',
  points: 12500,
  pointsToNextTier: 3500,
  memberSince: '2023-03-15',
  preferences: {
    roomType: 'high-floor',
    bedType: 'king',
    smoking: false,
    pillowType: 'firm',
    temperature: 68,
    dietary: ['vegetarian', 'gluten-free'],
    accessibility: ['hearing-loop'],
    communication: ['email', 'push'],
  },
  paymentMethods: [
    {
      id: 'PM-001',
      type: 'credit_card',
      brand: 'visa',
      last4: '4242',
      expiry: '12/27',
      isDefault: true,
    },
  ],
  documents: [
    {
      id: 'DOC-001',
      type: 'passport',
      country: 'US',
      numberHash: 'sha256:...',
      expiryDate: '2028-05-20',
      verified: true,
    },
  ],
};

/* ─── Guest Stays ─── */
export const guestStays = [
  {
    id: 'RES-4021',
    confirmationNumber: 'VMD-8X2K9P',
    status: 'checked_in',
    property: {
      id: 'TNT-001',
      name: 'Grand Hotel Boston',
      brand: 'Vimad Collection',
      address: {
        street: '123 Beacon Street',
        city: 'Boston',
        state: 'MA',
        zip: '02116',
        country: 'US',
      },
      phone: '+1617-555-0100',
      email: 'boston@grandhotel.com',
      coordinates: { lat: 42.3601, lng: -71.0589 },
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      ],
      amenities: ['spa', 'gym', 'pool', 'restaurant', 'valet'],
    },
    room: {
      number: '204',
      type: 'Deluxe King',
      floor: 2,
      bedCount: 1,
      bedType: 'king',
      view: 'city',
      sqft: 420,
      images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'],
      features: ['balcony', 'mini-bar', 'smart-tv', 'workspace'],
    },
    dates: {
      arrival: '2026-08-12',
      arrivalTime: '15:00',
      departure: '2026-08-15',
      departureTime: '11:00',
      nights: 3,
      earlyCheckIn: false,
      lateCheckOut: true,
    },
    rate: {
      nightly: 189,
      total: 567,
      taxes: 56.7,
      fees: 25,
      currency: 'ZAR',
      breakdown: [
        { date: '2026-08-12', rate: 189 },
        { date: '2026-08-13', rate: 189 },
        { date: '2026-08-14', rate: 189 },
      ],
    },
    folio: {
      charges: [
        {
          id: 'CHG-001',
          date: '2026-08-12',
          description: 'Room Rate',
          amount: 189,
          category: 'room',
        },
        {
          id: 'CHG-002',
          date: '2026-08-12',
          description: 'Room Service - Breakfast',
          amount: 32,
          category: 'dining',
        },
        {
          id: 'CHG-003',
          date: '2026-08-13',
          description: 'Spa Treatment',
          amount: 120,
          category: 'spa',
        },
      ],
      total: 648.7,
      paid: 648.7,
      balance: 0,
      payments: [
        { id: 'PAY-001', date: '2026-08-12', method: 'Credit Card ending 4242', amount: 648.7 },
      ],
      invoices: [
        { id: 'INV-001', date: '2026-08-12', type: 'deposit', amount: 200 },
        { id: 'INV-002', date: '2026-08-15', type: 'final', amount: 648.7 },
      ],
    },
    digitalKey: {
      id: 'DK-2026-001',
      status: 'active',
      type: 'mobile',
      issuedAt: '2026-08-12T15:30:00Z',
      expiresAt: '2026-08-15T11:00:00Z',
      accessLog: [
        { time: '2026-08-12T15:45:00Z', action: 'unlocked', location: 'Room 204' },
        { time: '2026-08-12T16:20:00Z', action: 'unlocked', location: 'Fitness Center' },
      ],
    },
    services: [
      {
        id: 'SVC-001',
        type: 'room_service',
        status: 'delivered',
        orderedAt: '2026-08-12T08:30:00Z',
        deliveredAt: '2026-08-12T09:15:00Z',
        items: [
          { name: 'Continental Breakfast', qty: 1, price: 24 },
          { name: 'Fresh Orange Juice', qty: 2, price: 8 },
        ],
        total: 32,
      },
    ],
    requests: [
      {
        id: 'REQ-001',
        type: 'housekeeping',
        status: 'completed',
        description: 'Extra towels',
        createdAt: '2026-08-12T18:00:00Z',
        completedAt: '2026-08-12T18:25:00Z',
      },
    ],
    review: {
      submitted: true,
      rating: 5,
      categories: {
        cleanliness: 5,
        service: 5,
        location: 4,
        value: 4,
        amenities: 5,
      },
      comment: 'Wonderful stay! The staff was incredibly helpful.',
      photos: [],
      submittedAt: '2026-08-16T10:00:00Z',
    },
    paymentMethods: [
      {
        id: 'PM-001',
        brand: 'visa',
        last4: '4242',
        expiry: '12/27',
        isDefault: true,
      },
    ],
  },
  {
    id: 'RES-4022',
    confirmationNumber: 'VMD-9Y3L0Q',
    status: 'confirmed',
    property: {
      id: 'TNT-002',
      name: 'Seaside Resort Miami',
      brand: 'Vimad Collection',
      address: {
        street: '456 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zip: '33139',
        country: 'US',
      },
      phone: '+1305-555-0200',
      email: 'miami@seasideresort.com',
      coordinates: { lat: 25.7617, lng: -80.1918 },
      images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'],
      amenities: ['beach', 'pool', 'spa', 'restaurant', 'gym'],
    },
    room: {
      number: null,
      type: 'Ocean View Suite',
      floor: 5,
      bedCount: 1,
      bedType: 'king',
      view: 'ocean',
      sqft: 650,
      images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'],
      features: ['balcony', 'jacuzzi', 'mini-bar', 'smart-tv', 'workspace'],
    },
    dates: {
      arrival: '2026-09-20',
      arrivalTime: '16:00',
      departure: '2026-09-25',
      departureTime: '11:00',
      nights: 5,
      earlyCheckIn: false,
      lateCheckOut: false,
    },
    rate: {
      nightly: 289,
      total: 1445,
      taxes: 144.5,
      fees: 50,
      currency: 'ZAR',
      breakdown: [
        { date: '2026-09-20', rate: 289 },
        { date: '2026-09-21', rate: 289 },
        { date: '2026-09-22', rate: 289 },
        { date: '2026-09-23', rate: 289 },
        { date: '2026-09-24', rate: 289 },
      ],
    },
    folio: {
      charges: [
        {
          id: 'CHG-101',
          date: '2026-09-20',
          description: 'Room Rate',
          amount: 289,
          category: 'room',
        },
      ],
      total: 289,
      paid: 0,
      balance: 289,
      payments: [],
      invoices: [{ id: 'INV-101', date: '2026-09-20', type: 'interim', amount: 289 }],
    },
    digitalKey: null,
    services: [],
    requests: [],
    review: null,
    paymentMethods: [],
  },
];

/* Convenience alias for current stay */
export const guestStay = guestStays[0];

/* ─── Past Stays ─── */
export const pastStays = [
  {
    id: 'RES-3892',
    confirmationNumber: 'VMD-7A3B2C',
    status: 'checked_out',
    property: { name: 'Grand Hotel Boston', brand: 'Vimad Collection' },
    dates: { arrival: '2026-06-10', departure: '2026-06-14', nights: 4 },
    rate: { total: 756, currency: 'ZAR' },
    folio: { total: 892.4, paid: 892.4, balance: 0 },
    pointsEarned: 892,
  },
  {
    id: 'RES-3541',
    confirmationNumber: 'VMD-5K9P1Q',
    status: 'checked_out',
    property: { name: 'Seaside Resort Miami', brand: 'Vimad Collection' },
    dates: { arrival: '2026-04-20', departure: '2026-04-25', nights: 5 },
    rate: { total: 1245, currency: 'ZAR' },
    folio: { total: 1450.8, paid: 1450.8, balance: 0 },
    pointsEarned: 1451,
  },
  {
    id: 'RES-3102',
    confirmationNumber: 'VMD-3M7N8R',
    status: 'checked_out',
    property: { name: 'Urban Hotel NYC', brand: 'Vimad Collection' },
    dates: { arrival: '2026-02-14', departure: '2026-02-16', nights: 2 },
    rate: { total: 520, currency: 'ZAR' },
    folio: { total: 612.3, paid: 612.3, balance: 0 },
    pointsEarned: 612,
  },
];

/* ─── Tier Benefits ─── */
export const tierBenefits = {
  bronze: {
    label: 'Bronze',
    color: 'text-amber-700',
    bg: 'bg-amber-700/10',
    border: 'border-amber-700/20',
    dot: 'bg-amber-700',
    benefits: ['Free Wi-Fi', 'Late checkout (12pm)', 'Member rates'],
    pointsMultiplier: 1.0,
    pointsRequired: 0,
  },
  silver: {
    label: 'Silver',
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/20',
    dot: 'bg-slate-400',
    benefits: ['All Bronze benefits', 'Room upgrade (subject to availability)', 'Welcome drink'],
    pointsMultiplier: 1.25,
    pointsRequired: 5000,
  },
  gold: {
    label: 'Gold',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    dot: 'bg-yellow-500',
    benefits: [
      'All Silver benefits',
      'Guaranteed room upgrade',
      'Free breakfast',
      'Early check-in',
    ],
    pointsMultiplier: 1.5,
    pointsRequired: 10000,
  },
  platinum: {
    label: 'Platinum',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    dot: 'bg-purple-500',
    benefits: [
      'All Gold benefits',
      'Suite upgrade',
      'Executive lounge access',
      'Free parking',
      'Spa credit',
    ],
    pointsMultiplier: 2.0,
    pointsRequired: 25000,
  },
};

/* ─── Rewards Catalog ─── */
export const rewardsCatalog = [
  {
    id: 'RWD-001',
    name: 'Free Night Stay',
    description: 'One complimentary night at any Vimad Collection property',
    pointsCost: 15000,
    category: 'stay',
    image: '🏨',
    available: true,
  },
  {
    id: 'RWD-002',
    name: 'Room Upgrade',
    description: 'Upgrade to next room category on your next stay',
    pointsCost: 5000,
    category: 'stay',
    image: '⬆️',
    available: true,
  },
  {
    id: 'RWD-003',
    name: 'Spa Treatment',
    description: '60-minute massage or facial at property spa',
    pointsCost: 8000,
    category: 'wellness',
    image: '💆',
    available: true,
  },
  {
    id: 'RWD-004',
    name: '$50 Dining Credit',
    description: 'Credit valid at any hotel restaurant or room service',
    pointsCost: 3500,
    category: 'dining',
    image: '🍽️',
    available: true,
  },
  {
    id: 'RWD-005',
    name: 'Late Checkout',
    description: 'Extend checkout until 4:00 PM',
    pointsCost: 2000,
    category: 'stay',
    image: '🕐',
    available: true,
  },
  {
    id: 'RWD-006',
    name: 'Airport Transfer',
    description: 'Complimentary airport pickup or drop-off',
    pointsCost: 6000,
    category: 'services',
    image: '🚗',
    available: true,
  },
  {
    id: 'RWD-007',
    name: 'Bottle of Champagne',
    description: 'Premium champagne delivered to your room',
    pointsCost: 4500,
    category: 'dining',
    image: '🍾',
    available: true,
  },
  {
    id: 'RWD-008',
    name: 'Executive Lounge Access',
    description: 'One-day access to executive lounge',
    pointsCost: 3000,
    category: 'stay',
    image: '🏢',
    available: true,
  },
];

/* ─── Points History ─── */
export const pointsHistory = [
  {
    id: 'TXN-001',
    date: '2026-08-14',
    type: 'earned',
    description: 'Stay at Grand Hotel Boston',
    points: 253,
    stayId: 'RES-4021',
    balance: 12500,
  },
  {
    id: 'TXN-002',
    date: '2026-08-13',
    type: 'earned',
    description: 'Stay at Grand Hotel Boston',
    points: 189,
    stayId: 'RES-4021',
    balance: 12247,
  },
  {
    id: 'TXN-003',
    date: '2026-08-12',
    type: 'earned',
    description: 'Stay at Grand Hotel Boston',
    points: 189,
    stayId: 'RES-4021',
    balance: 12058,
  },
  {
    id: 'TXN-004',
    date: '2026-08-12',
    type: 'earned',
    description: 'Welcome bonus — Gold tier',
    points: 500,
    stayId: null,
    balance: 11869,
  },
  {
    id: 'TXN-005',
    date: '2026-06-14',
    type: 'earned',
    description: 'Stay at Grand Hotel Boston',
    points: 892,
    stayId: 'RES-3892',
    balance: 11369,
  },
  {
    id: 'TXN-006',
    date: '2026-04-25',
    type: 'earned',
    description: 'Stay at Seaside Resort Miami',
    points: 1451,
    stayId: 'RES-3541',
    balance: 10477,
  },
  {
    id: 'TXN-007',
    date: '2026-04-25',
    type: 'redeemed',
    description: 'Room Upgrade — Seaside Resort',
    points: -5000,
    stayId: 'RES-3541',
    balance: 9026,
  },
  {
    id: 'TXN-008',
    date: '2026-02-16',
    type: 'earned',
    description: 'Stay at Urban Hotel NYC',
    points: 612,
    stayId: 'RES-3102',
    balance: 14026,
  },
  {
    id: 'TXN-009',
    date: '2026-01-15',
    type: 'earned',
    description: 'Anniversary bonus points',
    points: 1000,
    stayId: null,
    balance: 13414,
  },
  {
    id: 'TXN-010',
    date: '2025-12-20',
    type: 'redeemed',
    description: '$50 Dining Credit',
    points: -3500,
    stayId: null,
    balance: 12414,
  },
];

/* ─── Split Bill Participants ─── */
export const splitParticipants = [
  {
    id: 'P-001',
    name: 'John Smith',
    email: 'john.smith@email.com',
    avatar: 'JS',
    isPrimary: true,
    share: 50,
  },
  {
    id: 'P-002',
    name: 'Sarah Smith',
    email: 'sarah.smith@email.com',
    avatar: 'SS',
    isPrimary: false,
    share: 50,
  },
];

/* ─── Category Meta for Folio ─── */
export const folioCategoryMeta = {
  room: { label: 'Room', color: 'text-secondary', bg: 'bg-secondary/10', icon: '🏨' },
  dining: { label: 'Dining', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: '🍽️' },
  spa: { label: 'Spa & Wellness', color: 'text-pink-500', bg: 'bg-pink-500/10', icon: '💆' },
  services: { label: 'Services', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: '🛎️' },
};

/* ─── Room Service Menu ─── */
export const roomServiceMenu = {
  categories: [
    {
      id: 'breakfast',
      name: 'Breakfast',
      icon: 'Coffee',
      available: '06:00-11:00',
      items: [
        {
          id: 'B-001',
          name: 'Continental Breakfast',
          description: 'Fresh pastries, seasonal fruit, yogurt, granola',
          price: 24,
          image: 'https://images.unsplash.com/photo-1533089862017-5614ec95e22e?w=400',
          dietary: ['vegetarian'],
          allergens: ['gluten', 'dairy'],
          prepTime: 20,
        },
        {
          id: 'B-002',
          name: 'Eggs Benedict',
          description: 'Poached eggs, Canadian bacon, hollandaise on English muffin',
          price: 28,
          image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400',
          dietary: [],
          allergens: ['gluten', 'dairy', 'egg'],
          prepTime: 25,
        },
      ],
    },
    {
      id: 'all-day',
      name: 'All Day Dining',
      icon: 'UtensilsCrossed',
      available: '11:00-23:00',
      items: [
        {
          id: 'L-001',
          name: 'Caesar Salad',
          description: 'Romaine lettuce, parmesan, croutons, Caesar dressing',
          price: 18,
          image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400',
          dietary: ['vegetarian'],
          allergens: ['dairy', 'gluten', 'egg'],
          prepTime: 15,
        },
        {
          id: 'L-002',
          name: 'Grilled Salmon',
          description: 'Atlantic salmon, seasonal vegetables, lemon butter',
          price: 34,
          image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
          dietary: ['gluten-free'],
          allergens: ['fish', 'dairy'],
          prepTime: 30,
        },
      ],
    },
    {
      id: 'beverages',
      name: 'Beverages',
      icon: 'Wine',
      available: '24h',
      items: [
        {
          id: 'BV-001',
          name: 'Fresh Orange Juice',
          description: 'Squeezed daily',
          price: 8,
          image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400',
          dietary: ['vegan', 'gluten-free'],
          allergens: [],
          prepTime: 5,
        },
        {
          id: 'BV-002',
          name: 'House Red Wine',
          description: 'Cabernet Sauvignon, California',
          price: 14,
          image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
          dietary: ['vegan', 'gluten-free'],
          allergens: [],
          prepTime: 5,
        },
      ],
    },
    {
      id: 'amenities',
      name: 'Room Amenities',
      icon: 'Sparkles',
      available: '24h',
      items: [
        {
          id: 'A-001',
          name: 'Extra Pillows',
          description: 'Feather or foam',
          price: 0,
          image: '',
          dietary: [],
          allergens: [],
          prepTime: 10,
        },
        {
          id: 'A-002',
          name: 'Toiletries Kit',
          description: 'Premium bath amenities',
          price: 0,
          image: '',
          dietary: [],
          allergens: [],
          prepTime: 10,
        },
        {
          id: 'A-003',
          name: 'Iron & Board',
          description: 'Delivered to room',
          price: 0,
          image: '',
          dietary: [],
          allergens: [],
          prepTime: 15,
        },
      ],
    },
  ],
};

/* ─── Guest Announcements ─── */
export const guestAnnouncements = [
  {
    id: 'ANN-G-001',
    type: 'feature',
    priority: 'high',
    status: 'published',
    title: 'New Rooftop Spa Now Open',
    content:
      'Experience our newly renovated rooftop spa with panoramic city views. Book your treatment through the Concierge section.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    cta: { label: 'Book Spa Treatment', url: '/guest-portal/stay/concierge' },
    publishedAt: '2026-08-10T09:00:00Z',
    expiresAt: '2026-09-10T23:59:59Z',
  },
  {
    id: 'ANN-G-002',
    type: 'maintenance',
    priority: 'medium',
    status: 'published',
    title: 'Pool Maintenance Scheduled',
    content:
      'The rooftop pool will be closed for maintenance on August 20, 2026 from 6:00 AM to 12:00 PM.',
    cta: null,
    publishedAt: '2026-08-15T14:00:00Z',
    expiresAt: '2026-08-21T00:00:00Z',
  },
];

/* ─── Service Status Meta ─── */
export const serviceStatusMeta = {
  operational: {
    label: 'Operational',
    color: 'text-accent',
    dot: 'bg-accent',
    icon: 'CheckCircle2',
  },
  degraded: { label: 'Degraded', color: 'text-warning', dot: 'bg-warning', icon: 'AlertTriangle' },
  maintenance: { label: 'Maintenance', color: 'text-info', dot: 'bg-info', icon: 'Wrench' },
  unavailable: { label: 'Unavailable', color: 'text-danger', dot: 'bg-danger', icon: 'XCircle' },
};

/* ─── Mock Service Status ─── */
export const serviceStatuses = [
  { id: 'svc-001', name: 'Front Desk', status: 'operational', description: '24/7 reception' },
  { id: 'svc-002', name: 'Room Service', status: 'operational', description: 'Available 6AM–11PM' },
  {
    id: 'svc-003',
    name: 'Spa & Wellness',
    status: 'maintenance',
    description: 'Closed until 2PM for maintenance',
  },
  { id: 'svc-004', name: 'Fitness Center', status: 'operational', description: 'Open 5AM–11PM' },
  {
    id: 'svc-005',
    name: 'Rooftop Pool',
    status: 'degraded',
    description: 'Heating system under repair',
  },
  { id: 'svc-006', name: 'Business Center', status: 'operational', description: 'Open 7AM–10PM' },
  {
    id: 'svc-007',
    name: 'Valet Parking',
    status: 'operational',
    description: 'Available upon request',
  },
  {
    id: 'svc-008',
    name: 'Concierge',
    status: 'operational',
    description: 'Tour bookings & transport',
  },
];

/* ─── Document Types ─── */
export const documentTypes = [
  { id: 'passport', label: 'Passport', icon: 'BookOpen' },
  { id: 'drivers_license', label: "Driver's License", icon: 'Car' },
  { id: 'national_id', label: 'National ID', icon: 'IdCard' },
  { id: 'visa', label: 'Visa', icon: 'Plane' },
];

/* ─── Preference Options ─── */
export const roomTypeOptions = [
  { value: 'high-floor', label: 'High Floor' },
  { value: 'low-floor', label: 'Low Floor' },
  { value: 'quiet', label: 'Quiet Zone' },
  { value: 'near-elevator', label: 'Near Elevator' },
];

export const bedTypeOptions = [
  { value: 'king', label: 'King' },
  { value: 'queen', label: 'Queen' },
  { value: 'twin', label: 'Twin' },
  { value: 'double-double', label: 'Double-Double' },
];

export const pillowTypeOptions = [
  { value: 'firm', label: 'Firm' },
  { value: 'soft', label: 'Soft' },
  { value: 'feather', label: 'Feather' },
  { value: 'memory-foam', label: 'Memory Foam' },
  { value: 'hypoallergenic', label: 'Hypoallergenic' },
];

export const dietaryOptions = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'kosher',
  'halal',
  'nut-free',
  'shellfish-free',
  'low-sodium',
  'diabetic-friendly',
];

export const accessibilityOptions = [
  { value: 'wheelchair-accessible', label: 'Wheelchair Accessible Room' },
  { value: 'hearing-loop', label: 'Hearing Loop' },
  { value: 'visual-alert', label: 'Visual Alert Devices' },
  { value: 'grab-bars', label: 'Grab Bars' },
  { value: 'roll-in-shower', label: 'Roll-in Shower' },
  { value: 'service-animal', label: 'Service Animal Friendly' },
];

export const communicationOptions = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push Notifications' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'ar', label: 'العربية' },
];

/* ─── Helpers ─── */
export function formatCurrency(amount, currency = 'ZAR') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatPoints(points) {
  return new Intl.NumberFormat('en-US').format(points);
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateRange(arrival, departure) {
  const a = new Date(arrival);
  const d = new Date(departure);
  const sameMonth = a.getMonth() === d.getMonth();
  const sameYear = a.getFullYear() === d.getFullYear();
  if (sameMonth && sameYear) {
    return `${a.toLocaleDateString('en-US', { month: 'short' })} ${a.getDate()} – ${d.getDate()}, ${a.getFullYear()}`;
  }
  return `${a.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(isoString);
}

export function getStayPhase(stay) {
  const now = new Date();
  const arrival = new Date(stay.dates.arrival);
  const departure = new Date(stay.dates.departure);
  if (now < arrival) return 'pre-arrival';
  if (now >= arrival && now <= departure) return 'in-stay';
  return 'post-stay';
}

export function canCheckIn(stay) {
  const now = new Date();
  const arrival = new Date(stay.dates.arrival);
  const hoursBefore = (arrival - now) / (1000 * 60 * 60);
  return hoursBefore <= 24 && stay.status === 'confirmed';
}

export function getCancellationPolicy(stay) {
  const now = new Date();
  const arrival = new Date(stay.dates.arrival);
  const hoursBefore = (arrival - now) / (1000 * 60 * 60);
  if (hoursBefore >= 72)
    return {
      type: 'free',
      fee: 0,
      label: 'Free Cancellation',
      description: 'Cancel at least 72 hours before arrival for a full refund.',
    };
  if (hoursBefore >= 24)
    return {
      type: 'partial',
      fee: stay.rate.total * 0.5,
      label: 'Partial Refund',
      description: 'Cancel at least 24 hours before arrival for a 50% refund.',
    };
  return {
    type: 'non-refundable',
    fee: stay.rate.total,
    label: 'Non-Refundable',
    description: 'Cancellations within 24 hours of arrival are non-refundable.',
  };
}

export function getCategoryTotal(charges, category) {
  return charges.filter((c) => c.category === category).reduce((s, c) => s + c.amount, 0);
}

export function getTierProgress(tier, points) {
  const tiers = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIdx = tiers.indexOf(tier);
  const nextTier = tiers[currentIdx + 1];
  if (!nextTier) return { percent: 100, nextTier: null, pointsNeeded: 0 };
  const currentRequired = tierBenefits[tier].pointsRequired;
  const nextRequired = tierBenefits[nextTier].pointsRequired;
  const progress = points - currentRequired;
  const range = nextRequired - currentRequired;
  return {
    percent: Math.min(100, Math.round((progress / range) * 100)),
    nextTier,
    pointsNeeded: nextRequired - points,
  };
}

export function getPhaseColor(phase) {
  switch (phase) {
    case 'pre-arrival':
      return 'text-info';
    case 'in-stay':
      return 'text-accent';
    case 'post-stay':
      return 'text-text-muted';
    default:
      return 'text-text-muted';
  }
}

export function getPhaseBadge(phase) {
  switch (phase) {
    case 'pre-arrival':
      return { label: 'Upcoming', bg: 'bg-info/10', color: 'text-info', border: 'border-info/20' };
    case 'in-stay':
      return {
        label: 'Checked In',
        bg: 'bg-accent/10',
        color: 'text-accent',
        border: 'border-accent/20',
      };
    case 'post-stay':
      return {
        label: 'Completed',
        bg: 'bg-neutral/10',
        color: 'text-text-muted',
        border: 'border-border',
      };
    default:
      return {
        label: 'Unknown',
        bg: 'bg-neutral/10',
        color: 'text-text-muted',
        border: 'border-border',
      };
  }
}

/* ─── Status Meta ─── */
export const stayStatusMeta = {
  confirmed: {
    label: 'Confirmed',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  checked_in: {
    label: 'Checked In',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
  checked_out: {
    label: 'Checked Out',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
  no_show: {
    label: 'No Show',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
};

/* ─── Menu Availability Helper ─── */
export function isMenuAvailable(category) {
  if (!category?.available) return true; // Default to available if no time restriction

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  // Parse time range like "06:00-11:00" or "24h"
  if (category.available === '24h') return true;

  const [start, end] = category.available.split('-').map((t) => {
    const [hours, minutes] = t.split(':').map(Number);
    return hours * 60 + minutes;
  });

  if (start <= end) {
    return currentTime >= start && currentTime <= end;
  } else {
    // Overnight range (e.g., 22:00-06:00)
    return currentTime >= start || currentTime <= end;
  }
}

/* ─── Housekeeping Services ─── */
export const housekeepingServices = [
  {
    id: 'hk-001',
    name: 'Standard Cleaning',
    description: 'Daily room cleaning with bed making, vacuuming, and bathroom refresh',
    estimatedDuration: '30 min',
    icon: 'Sparkles',
    category: 'cleaning',
  },
  {
    id: 'hk-002',
    name: 'Deep Cleaning',
    description:
      'Thorough cleaning including carpet shampoo, window cleaning, and full sanitization',
    estimatedDuration: '90 min',
    icon: 'Sparkles',
    category: 'cleaning',
  },
  {
    id: 'hk-003',
    name: 'Turndown Service',
    description: 'Evening preparation with bed turn-down, lighting adjustment, and ambient setup',
    estimatedDuration: '15 min',
    icon: 'Moon',
    category: 'evening',
  },
  {
    id: 'hk-004',
    name: 'Extra Towels',
    description: 'Additional bath and hand towels delivered to your room',
    estimatedDuration: '10 min',
    icon: 'Droplets',
    category: 'amenities',
  },
  {
    id: 'hk-005',
    name: 'Extra Pillows',
    description: 'Additional pillows in your preferred firmness',
    estimatedDuration: '10 min',
    icon: 'Bed',
    category: 'amenities',
  },
  {
    id: 'hk-006',
    name: 'Toiletries Refill',
    description: 'Premium bath amenities, dental kit, shaving kit, and other essentials',
    estimatedDuration: '10 min',
    icon: 'Sparkles',
    category: 'amenities',
  },
  {
    id: 'hk-007',
    name: 'Laundry Service',
    description: 'Wash, dry, fold, and press services with same-day or express options',
    estimatedDuration: 'Varies',
    icon: 'Shirt',
    category: 'laundry',
  },
  {
    id: 'hk-008',
    name: 'Dry Cleaning',
    description: 'Professional dry cleaning for delicate garments',
    estimatedDuration: '24-48 hrs',
    icon: 'Shirt',
    category: 'laundry',
  },
];

/* ─── Concierge Services ─── */
export const conciergeServices = [
  {
    id: 'con-001',
    name: 'Restaurant Reservations',
    description: 'Book tables at top local restaurants and hotel dining venues',
    icon: 'UtensilsCrossed',
    category: 'dining',
    popular: true,
  },
  {
    id: 'con-002',
    name: 'Transportation',
    description: 'Airport transfers, car service, rental cars, and taxi arrangements',
    icon: 'Car',
    category: 'transport',
    popular: true,
  },
  {
    id: 'con-003',
    name: 'Tour & Activity Bookings',
    description: 'Local sightseeing tours, museum tickets, and curated experiences',
    icon: 'MapPin',
    category: 'activities',
    popular: true,
  },
  {
    id: 'con-004',
    name: 'Spa Appointments',
    description: 'Massage, facial, and wellness treatment bookings at the hotel spa',
    icon: 'Sparkles',
    category: 'wellness',
    popular: true,
  },
  {
    id: 'con-005',
    name: 'Event Tickets',
    description: 'Theater, concert, sports, and special event ticket procurement',
    icon: 'Ticket',
    category: 'entertainment',
    popular: false,
  },
  {
    id: 'con-006',
    name: 'Business Services',
    description: 'Printing, faxing, meeting room bookings, and secretarial support',
    icon: 'Briefcase',
    category: 'business',
    popular: false,
  },
  {
    id: 'con-007',
    name: 'Flower & Gift Delivery',
    description: 'Arrange floral bouquets, champagne, chocolates, or custom gifts',
    icon: 'Gift',
    category: 'gifts',
    popular: false,
  },
  {
    id: 'con-008',
    name: 'Personal Shopping',
    description: 'Stylist-assisted shopping or personal shopper arrangements',
    icon: 'ShoppingBag',
    category: 'shopping',
    popular: false,
  },
  {
    id: 'con-009',
    name: 'Luggage Storage',
    description: 'Secure storage for early arrival or late departure luggage',
    icon: 'Luggage',
    category: 'logistics',
    popular: false,
  },
  {
    id: 'con-010',
    name: 'Childcare Services',
    description: 'Professional babysitting and child activity arrangements',
    icon: 'Baby',
    category: 'family',
    popular: false,
  },
];

/* ─── Issue Categories ─── */
export const issueCategories = [
  {
    id: 'cat-room',
    label: 'Room Issue',
    description: 'Problems with room amenities, temperature, cleanliness, or maintenance',
    icon: 'Bed',
    priority: 'medium',
  },
  {
    id: 'cat-housekeeping',
    label: 'Housekeeping',
    description: 'Cleaning requests, missing items, or linen issues',
    icon: 'Sparkles',
    priority: 'low',
  },
  {
    id: 'cat-technical',
    label: 'Technical / Wi-Fi',
    description: 'Internet connectivity, TV, phone, or in-room technology problems',
    icon: 'Wifi',
    priority: 'high',
  },
  {
    id: 'cat-billing',
    label: 'Billing & Payment',
    description: 'Charges, invoicing, payment processing, or refund concerns',
    icon: 'CreditCard',
    priority: 'high',
  },
  {
    id: 'cat-noise',
    label: 'Noise Complaint',
    description: 'Excessive noise from neighboring rooms, hallways, or construction',
    icon: 'Volume2',
    priority: 'medium',
  },
  {
    id: 'cat-safety',
    label: 'Safety & Security',
    description: 'Security concerns, lock issues, or emergency situations',
    icon: 'Shield',
    priority: 'urgent',
  },
  {
    id: 'cat-service',
    label: 'Staff / Service',
    description: 'Feedback about staff interactions or service quality',
    icon: 'User',
    priority: 'low',
  },
  {
    id: 'cat-accessibility',
    label: 'Accessibility',
    description: 'Accessibility needs, ADA compliance, or mobility assistance',
    icon: 'Accessibility',
    priority: 'high',
  },
  {
    id: 'cat-food',
    label: 'Food & Beverage',
    description: 'Room service, restaurant, or dining-related issues',
    icon: 'UtensilsCrossed',
    priority: 'medium',
  },
  {
    id: 'cat-other',
    label: 'Other',
    description: 'Any other issue not covered by the categories above',
    icon: 'HelpCircle',
    priority: 'low',
  },
];
