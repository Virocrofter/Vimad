import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  DollarSign,
  Edit3,
  FileText,
  Flower2,
  Heart,
  LayoutGrid,
  Leaf,
  List,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  Minus,
  Phone,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
  User,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
}

function calculateBeoTotal(beo) {
  const room = roomTypes.find((r) => r.id === beo.roomId);
  const setup = setupOptions.find((s) => s.id === beo.setupId);
  const menu = menuPackages.find((m) => m.id === beo.menuPackageId);
  const av = avPackages.find((a) => a.id === beo.avPackageId);

  const roomPrice = room ? (beo.roomPriceOverride ?? room.price) : 0;
  const setupPrice = setup ? (beo.setupPriceOverride ?? setup.price) : 0;
  const menuPrice = menu ? (beo.menuPriceOverride ?? menu.price) * (beo.guestCount || 0) : 0;
  const avPrice = av ? (beo.avPriceOverride ?? av.price) : 0;
  const servicesTotal = (beo.additionalServices || []).reduce((sum, s) => sum + (s.price || 0), 0);
  const decorTotal = (beo.decor || []).reduce((sum, d) => {
    const opt = decorOptions.find((o) => o.id === d.optionId);
    return sum + (opt ? opt.price * d.qty : 0);
  }, 0);

  const subtotal = roomPrice + setupPrice + menuPrice + avPrice + servicesTotal + decorTotal;
  const tax = subtotal * 0.0875;
  const gratuity = menuPrice * 0.22;
  const grandTotal = subtotal + tax + gratuity;

  return {
    roomPrice,
    setupPrice,
    menuPrice,
    avPrice,
    servicesTotal,
    decorTotal,
    subtotal,
    tax,
    gratuity,
    grandTotal,
  };
}

/* ─── Event Type Meta ─── */
const eventTypes = {
  wedding: { label: 'Wedding', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  corporate: { label: 'Corporate', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  social: { label: 'Social', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  conference: {
    label: 'Conference',
    icon: Mic,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  banquet: { label: 'Banquet', icon: Utensils, color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

function getEventTypeMeta(type) {
  return eventTypes[type] || eventTypes.corporate;
}

/* ─── Status Meta ─── */
const beoStatuses = {
  confirmed: {
    label: 'Confirmed',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
  },
  pending: {
    label: 'Pending',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  draft: {
    label: 'Draft',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
  approved: { label: 'Approved', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  revisions: {
    label: 'Revisions',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  cancelled: {
    label: 'Cancelled',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
};

function StatusBadge({ status }) {
  const meta = beoStatuses[status] || beoStatuses.draft;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      {subtext && <p className="text-xs text-text-muted mt-0.5">{subtext}</p>}
    </div>
  );
}

/* ─── Mock Data ─── */
const roomTypes = [
  {
    id: 'grand-ballroom',
    name: 'Grand Ballroom',
    capacity: 300,
    price: 2500,
    sqft: 5000,
    features: ['Stage', 'Dance Floor', 'Natural Light'],
  },
  {
    id: 'terrace',
    name: 'Terrace Room',
    capacity: 120,
    price: 1200,
    sqft: 2000,
    features: ['Outdoor Access', 'City View'],
  },
  {
    id: 'boardroom',
    name: 'Boardroom',
    capacity: 20,
    price: 400,
    sqft: 400,
    features: ['Video Conferencing', 'Whiteboard'],
  },
  {
    id: 'conference-a',
    name: 'Conference Center A',
    capacity: 80,
    price: 800,
    sqft: 1200,
    features: ['Projector', 'Breakout Space'],
  },
  {
    id: 'conference-b',
    name: 'Conference Center B',
    capacity: 60,
    price: 600,
    sqft: 900,
    features: ['Projector', 'Whiteboard'],
  },
  {
    id: 'breakout-1',
    name: 'Breakout Room 1',
    capacity: 30,
    price: 300,
    sqft: 500,
    features: ['Whiteboard'],
  },
  {
    id: 'poolside',
    name: 'Poolside Pavilion',
    capacity: 150,
    price: 1500,
    sqft: 2500,
    features: ['Outdoor', 'Bar Access', 'String Lights'],
  },
];

const Wine = Utensils;

const setupOptions = [
  { id: 'theater', name: 'Theater Style', price: 0, icon: LayoutGrid },
  { id: 'banquet', name: 'Banquet Rounds', price: 200, icon: Utensils },
  { id: 'classroom', name: 'Classroom', price: 100, icon: ClipboardList },
  { id: 'cocktail', name: 'Cocktail / Reception', price: 150, icon: Wine },
  { id: 'board', name: 'Boardroom', price: 0, icon: Building2 },
  { id: 'u-shape', name: 'U-Shape', price: 50, icon: LayoutGrid },
  { id: 'hollow', name: 'Hollow Square', price: 50, icon: LayoutGrid },
];

const menuPackages = [
  {
    id: 'plated-premium',
    name: 'Plated Premium',
    price: 85,
    pricePerPerson: 85,
    description: '3-course plated dinner with premium proteins',
    courses: [
      { course: 'First', items: ['Heirloom Tomato Salad (V)', 'Shrimp Cocktail', 'Soup du Jour'] },
      { course: 'Main', items: ['Filet Mignon', 'Pan-Seared Salmon', 'Wild Mushroom Risotto (V)'] },
      { course: 'Dessert', items: ['Chocolate Lava Cake', 'Crème Brûlée', 'Seasonal Sorbet (V)'] },
    ],
    includes: ['Coffee & Tea', 'Dinner Rolls', 'Service Staff'],
  },
  {
    id: 'plated-standard',
    name: 'Plated Standard',
    price: 55,
    pricePerPerson: 55,
    description: '3-course plated dinner with standard selections',
    courses: [
      { course: 'First', items: ['Garden Salad', 'Soup du Jour'] },
      { course: 'Main', items: ['Roasted Chicken', 'Grilled Salmon', 'Vegetable Lasagna (V)'] },
      { course: 'Dessert', items: ['Cheesecake', 'Fruit Tart'] },
    ],
    includes: ['Coffee & Tea', 'Dinner Rolls'],
  },
  {
    id: 'buffet-premium',
    name: 'Premium Buffet',
    price: 65,
    pricePerPerson: 65,
    description: 'Premium buffet with carving station',
    courses: [
      { course: 'Salads', items: ['Caesar Salad', 'Mixed Greens', 'Pasta Salad'] },
      {
        course: 'Entrees',
        items: [
          'Prime Rib Carving Station',
          'Grilled Salmon',
          'Stuffed Chicken Breast',
          'Vegetable Stir Fry (V)',
        ],
      },
      { course: 'Sides', items: ['Roasted Potatoes', 'Seasonal Vegetables', 'Rice Pilaf'] },
    ],
    includes: ['Coffee & Tea', 'Rolls & Butter', 'Service Staff'],
  },
  {
    id: 'buffet-standard',
    name: 'Standard Buffet',
    price: 45,
    pricePerPerson: 45,
    description: 'Standard buffet with salad bar',
    courses: [
      { course: 'Salads', items: ['Garden Salad', 'Pasta Salad'] },
      { course: 'Entrees', items: ['Roasted Chicken', 'Baked Fish', 'Vegetable Lasagna (V)'] },
      { course: 'Sides', items: ['Mashed Potatoes', 'Seasonal Vegetables', 'Rice'] },
    ],
    includes: ['Coffee & Tea', 'Rolls & Butter'],
  },
  {
    id: 'cocktail-premium',
    name: 'Premium Cocktail',
    price: 75,
    pricePerPerson: 75,
    description: "Premium passed hors d'oeuvres and stations",
    courses: [
      {
        course: 'Passed',
        items: ['Ahi Tuna Tartare', 'Bacon-Wrapped Scallops', 'Mini Crab Cakes', 'Bruschetta Bar'],
      },
      { course: 'Stations', items: ['Raw Bar', 'Charcuterie', 'Sushi Station'] },
    ],
    includes: ['Service Staff', 'Display Tables', 'Linens'],
  },
  {
    id: 'cocktail-standard',
    name: 'Standard Cocktail',
    price: 50,
    pricePerPerson: 50,
    description: "Standard passed hors d'oeuvres",
    courses: [
      {
        course: 'Passed',
        items: ['Meatballs', 'Spring Rolls', 'Cheese & Crackers', 'Veggie Platter'],
      },
    ],
    includes: ['Service Staff', 'Display Tables'],
  },
  {
    id: 'breakfast',
    name: 'Continental Breakfast',
    price: 25,
    pricePerPerson: 25,
    description: 'Pastries, fruit, coffee, juice',
    courses: [
      { course: 'Pastries', items: ['Assorted Muffins', 'Danishes', 'Bagels'] },
      { course: 'Fresh', items: ['Seasonal Fruit', 'Yogurt Parfait'] },
    ],
    includes: ['Coffee & Tea', 'Juice', 'Water'],
  },
  {
    id: 'breakfast-full',
    name: 'Full Breakfast',
    price: 35,
    pricePerPerson: 35,
    description: 'Hot breakfast buffet with omelet station',
    courses: [
      {
        course: 'Hot',
        items: ['Scrambled Eggs', 'Bacon & Sausage', 'Home Fries', 'Omelet Station'],
      },
      { course: 'Continental', items: ['Pastries', 'Fruit', 'Yogurt'] },
    ],
    includes: ['Coffee & Tea', 'Juice', 'Water', 'Service Staff'],
  },
];

const avPackages = [
  {
    id: 'av-basic',
    name: 'Basic AV',
    price: 300,
    description: 'Projector, screen, wireless mic',
    items: [
      'Single Projector & Screen',
      '1 Wireless Microphone',
      'Basic Sound System',
      'Laptop Connection',
    ],
  },
  {
    id: 'av-standard',
    name: 'Standard AV',
    price: 600,
    description: 'Dual projectors, screens, 2 wireless mics, podium',
    items: [
      'Dual Projectors & Screens',
      '2 Wireless Microphones',
      'Enhanced Sound System',
      'Podium with Mic',
      'Laptop Connection',
    ],
  },
  {
    id: 'av-premium',
    name: 'Premium AV',
    price: 1200,
    description: 'Full production: lighting, sound, video, technician',
    items: [
      'Full Lighting Package',
      'Professional Sound System',
      'Multiple Wireless Mics',
      'Video Recording',
      'On-site Technician',
      'Live Streaming Capable',
    ],
  },
  {
    id: 'av-none',
    name: 'No AV Needed',
    price: 0,
    description: 'No audio/visual equipment required',
    items: ['No equipment provided'],
  },
];

const decorOptions = [
  { id: 'centerpieces', name: 'Floral Centerpieces', price: 45, unit: 'each', icon: Flower2 },
  { id: 'linens-premium', name: 'Premium Linens', price: 12, unit: 'each', icon: LayoutGrid },
  { id: 'chair-covers', name: 'Chair Covers & Sashes', price: 5, unit: 'each', icon: LayoutGrid },
  { id: 'uplighting', name: 'LED Uplighting', price: 35, unit: 'per fixture', icon: Mic },
  { id: 'draping', name: 'Pipe & Draping', price: 150, unit: 'per 10ft', icon: LayoutGrid },
  { id: 'backdrop', name: 'Custom Backdrop', price: 300, unit: 'each', icon: LayoutGrid },
  { id: 'candles', name: 'LED Candles', price: 8, unit: 'each', icon: Flower2 },
  {
    id: 'table-numbers',
    name: 'Table Numbers & Holders',
    price: 3,
    unit: 'each',
    icon: ClipboardList,
  },
];

const initialBeos = [
  {
    id: 'BEO-2026-001',
    eventName: 'Smith Wedding Reception',
    company: 'Smith Family Events',
    clientName: 'Jane Smith',
    clientEmail: 'jane@smithwedding.com',
    clientPhone: '+1 555-0201',
    eventType: 'wedding',
    status: 'confirmed',
    date: '2026-08-20',
    startTime: '18:00',
    endTime: '23:00',
    guestCount: 120,
    roomId: 'grand-ballroom',
    setupId: 'banquet',
    menuPackageId: 'plated-premium',
    menuPriceOverride: null,
    avPackageId: 'av-standard',
    avPriceOverride: null,
    roomPriceOverride: null,
    setupPriceOverride: null,
    additionalServices: [
      { name: 'Champagne Toast', price: 350 },
      { name: 'Wedding Cake', price: 450 },
      { name: 'Floral Centerpieces', price: 600 },
    ],
    decor: [
      { optionId: 'centerpieces', qty: 12 },
      { optionId: 'linens-premium', qty: 12 },
      { optionId: 'candles', qty: 24 },
    ],
    timeline: [
      { time: '18:00', activity: 'Guest arrival & cocktail hour', dept: 'Banquet' },
      { time: '19:00', activity: 'Grand entrance & first dance', dept: 'Banquet' },
      { time: '19:30', activity: 'Dinner service begins', dept: 'Culinary' },
      { time: '21:00', activity: 'Cake cutting & toasts', dept: 'Banquet' },
      { time: '22:00', activity: 'Open dancing', dept: 'Banquet' },
      { time: '23:00', activity: 'Last call & send-off', dept: 'Banquet' },
    ],
    notes: [
      {
        id: 1,
        author: 'Sarah J.',
        date: '2026-08-15',
        content:
          'Welcome bags at check-in. Late checkout approved for bridal suite. Vegan meals for 4 guests.',
      },
    ],
    assignedPlanner: 'Sarah J.',
    createdAt: '2026-06-01',
    updatedAt: '2026-08-15T10:30:00Z',
  },
  {
    id: 'BEO-2026-002',
    eventName: 'TechConf 2026 — Opening Keynote',
    company: 'DevSummit Inc.',
    clientName: 'Michael Chen',
    clientEmail: 'm.chen@devsummit.io',
    clientPhone: '+1 555-0202',
    eventType: 'conference',
    status: 'confirmed',
    date: '2026-09-15',
    startTime: '09:00',
    endTime: '12:00',
    guestCount: 200,
    roomId: 'grand-ballroom',
    setupId: 'theater',
    menuPackageId: 'breakfast-full',
    menuPriceOverride: null,
    avPackageId: 'av-premium',
    avPriceOverride: null,
    roomPriceOverride: null,
    setupPriceOverride: null,
    additionalServices: [
      { name: 'Live Streaming Setup', price: 800 },
      { name: 'Recording & Editing', price: 1200 },
    ],
    decor: [
      { optionId: 'backdrop', qty: 1 },
      { optionId: 'uplighting', qty: 8 },
    ],
    timeline: [
      { time: '08:00', activity: 'AV setup & sound check', dept: 'AV' },
      { time: '09:00', activity: 'Doors open, breakfast buffet', dept: 'Culinary' },
      { time: '09:30', activity: 'Welcome remarks', dept: 'Banquet' },
      { time: '10:00', activity: 'Keynote presentation', dept: 'AV' },
      { time: '11:30', activity: 'Q&A session', dept: 'AV' },
      { time: '12:00', activity: 'Transition to breakout sessions', dept: 'Banquet' },
    ],
    notes: [
      {
        id: 2,
        author: 'Mike C.',
        date: '2026-08-14',
        content: 'Requires live streaming to remote attendees. Recording rights included.',
      },
    ],
    assignedPlanner: 'Mike C.',
    createdAt: '2026-07-15',
    updatedAt: '2026-08-14T14:15:00Z',
  },
  {
    id: 'BEO-2026-003',
    eventName: 'Acme Corp Q3 Sales Meeting',
    company: 'Acme Corporation',
    clientName: 'Sarah Williams',
    clientEmail: 's.williams@acme.com',
    clientPhone: '+1 555-0204',
    eventType: 'corporate',
    status: 'pending',
    date: '2026-10-05',
    startTime: '08:00',
    endTime: '17:00',
    guestCount: 45,
    roomId: 'conference-a',
    setupId: 'classroom',
    menuPackageId: 'breakfast',
    menuPriceOverride: null,
    avPackageId: 'av-standard',
    avPriceOverride: null,
    roomPriceOverride: null,
    setupPriceOverride: null,
    additionalServices: [
      { name: 'Flip Charts & Markers', price: 75 },
      { name: 'Notepads & Pens', price: 50 },
    ],
    decor: [],
    timeline: [
      { time: '08:00', activity: 'Breakfast & networking', dept: 'Culinary' },
      { time: '09:00', activity: 'Q3 review presentation', dept: 'AV' },
      { time: '12:00', activity: 'Working lunch (off-site)', dept: 'Culinary' },
      { time: '13:30', activity: 'Breakout strategy sessions', dept: 'Banquet' },
      { time: '16:00', activity: 'Leadership panel', dept: 'AV' },
      { time: '17:00', activity: 'Wrap-up & next steps', dept: 'Banquet' },
    ],
    notes: [
      {
        id: 3,
        author: 'Admin',
        date: '2026-08-10',
        content:
          'Waiting on final headcount. Dietary restrictions TBD. Direct bill to corporate account.',
      },
    ],
    assignedPlanner: null,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'BEO-2026-004',
    eventName: 'Johnson Family Reunion Dinner',
    company: null,
    clientName: 'Robert Johnson',
    clientEmail: 'r.johnson@email.com',
    clientPhone: '+1 555-0203',
    eventType: 'social',
    status: 'draft',
    date: '2026-08-25',
    startTime: '18:00',
    endTime: '21:00',
    guestCount: 35,
    roomId: 'terrace',
    setupId: 'banquet',
    menuPackageId: 'buffet-standard',
    menuPriceOverride: null,
    avPackageId: 'av-none',
    avPriceOverride: null,
    roomPriceOverride: null,
    setupPriceOverride: null,
    additionalServices: [{ name: 'Photo Display Board', price: 100 }],
    decor: [{ optionId: 'table-numbers', qty: 4 }],
    timeline: [
      { time: '18:00', activity: 'Cocktail hour', dept: 'Banquet' },
      { time: '18:30', activity: 'Dinner buffet opens', dept: 'Culinary' },
      { time: '19:30', activity: 'Family slideshow & toasts', dept: 'AV' },
      { time: '20:30', activity: 'Dessert & coffee', dept: 'Culinary' },
      { time: '21:00', activity: 'Event concludes', dept: 'Banquet' },
    ],
    notes: [
      {
        id: 4,
        author: 'Admin',
        date: '2026-08-12',
        content: 'Draft — awaiting deposit. Kids menu needed for 8 children.',
      },
    ],
    assignedPlanner: null,
    createdAt: '2026-08-05',
    updatedAt: '2026-08-12T16:45:00Z',
  },
  {
    id: 'BEO-2026-005',
    eventName: 'Nexus Pharma — Product Launch Gala',
    company: 'Nexus Pharma',
    clientName: 'David Park',
    clientEmail: 'd.park@nexuspharma.com',
    clientPhone: '+1 555-0205',
    eventType: 'corporate',
    status: 'confirmed',
    date: '2026-11-10',
    startTime: '19:00',
    endTime: '23:00',
    guestCount: 180,
    roomId: 'grand-ballroom',
    setupId: 'cocktail',
    menuPackageId: 'cocktail-premium',
    menuPriceOverride: null,
    avPackageId: 'av-premium',
    avPriceOverride: null,
    roomPriceOverride: null,
    setupPriceOverride: null,
    additionalServices: [
      { name: 'Branded Step-and-Repeat', price: 500 },
      { name: 'Professional Photographer', price: 1500 },
      { name: 'Valet Parking', price: 800 },
    ],
    decor: [
      { optionId: 'backdrop', qty: 1 },
      { optionId: 'uplighting', qty: 12 },
      { optionId: 'centerpieces', qty: 18 },
    ],
    timeline: [
      { time: '19:00', activity: 'VIP reception & product demo', dept: 'Banquet' },
      { time: '20:00', activity: 'Doors open to all guests', dept: 'Banquet' },
      { time: '20:30', activity: 'CEO welcome & product reveal', dept: 'AV' },
      { time: '21:00', activity: 'Premium cocktail stations open', dept: 'Culinary' },
      { time: '22:00', activity: 'Live entertainment', dept: 'AV' },
      { time: '23:00', activity: 'Event concludes', dept: 'Banquet' },
    ],
    notes: [
      {
        id: 5,
        author: 'Sarah J.',
        date: '2026-08-15',
        content:
          'High-profile event. Security detail required. Media presence expected. Comp suite for CEO.',
      },
    ],
    assignedPlanner: 'Sarah J.',
    createdAt: '2026-07-20',
    updatedAt: '2026-08-15T11:00:00Z',
  },
];

/* ─── BEO Detail Page (replaces the side drawer) ─── */
function BeoDetailPage({ beo, onBack, onEdit, onDuplicate, onDelete, onStatusChange }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState(beo.notes || []);
  const totals = calculateBeoTotal(beo);
  const room = roomTypes.find((r) => r.id === beo.roomId);
  const setup = setupOptions.find((s) => s.id === beo.setupId);
  const menuPkg = menuPackages.find((p) => p.id === beo.menuPackageId);
  const avPkg = avPackages.find((p) => p.id === beo.avPackageId);
  const eventType = getEventTypeMeta(beo.eventType);
  const EventIcon = eventType.icon;

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes((prev) => [
      {
        id: Date.now(),
        author: 'You',
        date: new Date().toISOString().split('T')[0],
        content: newNote.trim(),
      },
      ...prev,
    ]);
    setNewNote('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'menu', label: 'Menu & Beverage', icon: Utensils },
    { id: 'av', label: 'AV & Setup', icon: Mic },
    { id: 'decor', label: 'Decor & Rentals', icon: Flower2 },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to BEOs
        </Button>
      </div>

      {/* Event Header */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
              <EventIcon className="h-7 w-7 text-secondary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary">{beo.eventName}</h1>
                <StatusBadge status={beo.status} />
              </div>
              <p className="text-sm text-text-muted mt-0.5">
                {beo.id} &middot; {eventType.label} &middot; {beo.company || 'Individual Client'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {beo.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {beo.startTime} &ndash; {beo.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {beo.guestCount} guests
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {room?.name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => onDuplicate(beo)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(beo)}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-danger border-danger/30 hover:bg-danger/10"
              onClick={() => onDelete(beo.id)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                Financial Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-text-muted">Menu & Beverage</p>
                  <p className="text-lg font-bold font-mono text-text-primary">
                    {formatCurrency(totals.menuPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">AV & Production</p>
                  <p className="text-lg font-bold font-mono text-text-primary">
                    {formatCurrency(totals.avPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Decor & Rentals</p>
                  <p className="text-lg font-bold font-mono text-text-primary">
                    {formatCurrency(totals.decorTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Additional Services</p>
                  <p className="text-lg font-bold font-mono text-text-primary">
                    {formatCurrency(totals.servicesTotal)}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Grand Total</span>
                <span className="text-2xl font-bold font-mono text-secondary">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
              <div className="mt-1 text-xs text-text-muted text-right">
                {beo.guestCount > 0 ? formatCurrency(totals.grandTotal / beo.guestCount) : '$0.00'}{' '}
                per person
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
                Client Information
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 text-sm text-text-primary">
                  <User className="h-4 w-4 text-text-muted" />
                  {beo.clientName}
                </div>
                <div className="flex items-center gap-3 text-sm text-text-primary">
                  <Building2 className="h-4 w-4 text-text-muted" />
                  {beo.company || '—'}
                </div>
                <div className="flex items-center gap-3 text-sm text-text-primary">
                  <Mail className="h-4 w-4 text-text-muted" />
                  {beo.clientEmail}
                </div>
                <div className="flex items-center gap-3 text-sm text-text-primary">
                  <Phone className="h-4 w-4 text-text-muted" />
                  {beo.clientPhone}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
                Venue & Setup
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-semibold text-text-primary">{room?.name}</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Capacity: {room?.capacity} &middot; {room?.sqft?.toLocaleString()} sq ft
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {room?.features?.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent border border-accent/20"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutGrid className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-semibold text-text-primary">{setup?.name}</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Room configuration for {beo.guestCount} guests
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">Assigned Planner</p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {beo.assignedPlanner || 'Unassigned'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">Last Updated</p>
                <p className="mt-1 text-sm font-medium text-text-primary">{beo.updatedAt}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {beo.status !== 'confirmed' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onStatusChange(beo.id, 'confirmed')}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Confirm BEO
                </Button>
              )}
              {beo.status !== 'approved' && beo.status !== 'confirmed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(beo.id, 'approved')}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Approve
                </Button>
              )}
              {beo.status !== 'revisions' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(beo.id, 'revisions')}
                >
                  <Edit3 className="mr-1.5 h-4 w-4" /> Request Revisions
                </Button>
              )}
              {beo.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-danger border-danger/30 hover:bg-danger/10"
                  onClick={() => onStatusChange(beo.id, 'cancelled')}
                >
                  <Ban className="mr-1.5 h-4 w-4" /> Cancel
                </Button>
              )}
            </div>
          </div>
        )}
        {/* ─── Menu Tab ─── */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-secondary" />
                  <h3 className="text-sm font-semibold text-text-primary">Menu Package</h3>
                </div>
                <span className="text-lg font-bold font-mono text-text-primary">
                  {formatCurrency(beo.menuPriceOverride || menuPkg?.pricePerPerson || 0)}{' '}
                  <span className="text-sm font-normal text-text-muted">/ person</span>
                </span>
              </div>
              <p className="text-sm font-medium text-text-primary mb-3">{menuPkg?.name}</p>
              <div className="space-y-3">
                {menuPkg?.courses?.map((course, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                      {course.course}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {course.items.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 text-xs text-text-secondary border border-border"
                        >
                          {item.includes('(V)') && <Leaf className="h-3 w-3 text-accent" />}
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {menuPkg?.includes && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                    Included
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {menuPkg.includes.map((inc) => (
                      <span key={inc} className="text-xs text-text-secondary">
                        &bull; {inc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
                Menu Cost Breakdown
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Package Rate</span>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(beo.menuPriceOverride || menuPkg?.pricePerPerson || 0)} &times;{' '}
                    {beo.guestCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                  <span className="text-text-primary">Menu Subtotal</span>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(totals.menuPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ─── AV Tab ─── */}
        {activeTab === 'av' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-secondary" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    AV & Production Package
                  </h3>
                </div>
                <span className="text-lg font-bold font-mono text-text-primary">
                  {formatCurrency(beo.avPriceOverride || avPkg?.price || 0)}
                </span>
              </div>
              <p className="text-sm font-medium text-text-primary mb-3">{avPkg?.name}</p>
              <div className="space-y-2">
                {avPkg?.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
                Room Setup
              </h3>
              <div className="rounded-lg border-2 border-dashed border-border bg-background p-8 text-center">
                <LayoutGrid className="mx-auto h-10 w-10 text-text-muted mb-2" />
                <p className="text-sm text-text-muted">{setup?.name}</p>
                <p className="text-xs text-text-muted mt-1">
                  {beo.guestCount} guests &middot; {room?.name}
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Floor Plan
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* ─── Decor Tab ─── */}
        {activeTab === 'decor' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                Decor & Rentals
              </h3>
              <div className="space-y-3">
                {(beo.decor || []).map((d, i) => {
                  const opt = decorOptions.find((o) => o.id === d.optionId);
                  if (!opt) return null;
                  const lineTotal = opt.price * d.qty;
                  const Icon = opt.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
                          <Icon className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{opt.name}</p>
                          <p className="text-xs text-text-muted">
                            {formatCurrency(opt.price)} {opt.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium text-text-primary">
                          &times; {d.qty}
                        </p>
                        <p className="text-xs font-mono text-text-muted">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!beo.decor || beo.decor.length === 0) && (
                  <div className="text-center py-6 text-text-muted text-sm">
                    No decor items selected
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between">
                <span className="text-sm font-medium text-text-primary">Decor Subtotal</span>
                <span className="text-sm font-bold font-mono text-text-primary">
                  {formatCurrency(totals.decorTotal)}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
                Additional Services
              </h3>
              <div className="space-y-2">
                {(beo.additionalServices || []).map((svc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{svc.name}</span>
                    <span className="font-mono text-text-primary">{formatCurrency(svc.price)}</span>
                  </div>
                ))}
                {(!beo.additionalServices || beo.additionalServices.length === 0) && (
                  <div className="text-center py-4 text-text-muted text-sm">
                    No additional services
                  </div>
                )}
              </div>
              {(beo.additionalServices || []).length > 0 && (
                <div className="mt-2 pt-2 border-t border-border flex justify-between">
                  <span className="text-sm font-medium text-text-primary">Services Subtotal</span>
                  <span className="text-sm font-bold font-mono text-text-primary">
                    {formatCurrency(totals.servicesTotal)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ─── Timeline Tab ─── */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                Event Day Timeline
              </h3>
              <Button variant="outline" size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
              </Button>
            </div>
            {(beo.timeline || []).length > 0 ? (
              <div className="relative space-y-0">
                {beo.timeline.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                        {item.time}
                      </div>
                      {i < beo.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border min-h-6" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex-1 rounded-lg border p-3 mb-3',
                        i % 2 === 0 ? 'bg-surface border-border' : 'bg-background border-border'
                      )}
                    >
                      <p className="text-sm font-medium text-text-primary">{item.activity}</p>
                      <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent border border-accent/20">
                        {item.dept}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-8 text-center">
                <Clock className="mx-auto h-10 w-10 text-text-muted mb-2" />
                <p className="text-sm text-text-muted">No timeline items yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Build Timeline
                </Button>
              </div>
            )}
          </div>
        )}
        {/* ─── Notes Tab ─── */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
                Add Note
              </h3>
              <div className="flex gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add an internal note about this BEO..."
                  rows={3}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <Button onClick={addNote} className="self-end" size="sm">
                  <Send className="mr-1.5 h-4 w-4" /> Post
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                        {note.author[0]}
                      </div>
                      <span className="text-sm font-medium text-text-primary">{note.author}</span>
                    </div>
                    <span className="text-xs text-text-muted">{note.date}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{note.content}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">No notes yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── BEO Builder Modal ─── */
function BeoBuilderModal({ beo, onClose, onSave }) {
  const isEditing = !!beo;
  const [form, setForm] = useState({
    eventName: beo?.eventName || '',
    eventType: beo?.eventType || 'corporate',
    clientName: beo?.clientName || '',
    clientEmail: beo?.clientEmail || '',
    clientPhone: beo?.clientPhone || '',
    company: beo?.company || '',
    date: beo?.date || '',
    startTime: beo?.startTime || '08:00',
    endTime: beo?.endTime || '17:00',
    guestCount: beo?.guestCount || 50,
    roomId: beo?.roomId || 'grand-ballroom',
    setupId: beo?.setupId || 'banquet',
    menuPackageId: beo?.menuPackageId || 'plated-standard',
    menuPriceOverride: beo?.menuPriceOverride || '',
    avPackageId: beo?.avPackageId || 'av-basic',
    avPriceOverride: beo?.avPriceOverride || '',
    decor: beo?.decor ? [...beo.decor] : [],
    additionalServices: beo?.additionalServices ? [...beo.additionalServices] : [],
    notes: beo?.notes ? [...beo.notes] : [],
    timeline: beo?.timeline ? [...beo.timeline] : [],
    assignedPlanner: beo?.assignedPlanner || '',
    status: beo?.status || 'draft',
  });

  const [activeStep, setActiveStep] = useState(0);
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [newTimelineItem, setNewTimelineItem] = useState({
    time: '',
    activity: '',
    dept: 'Banquet',
  });

  const steps = [
    { id: 'details', label: 'Event Details', icon: FileText },
    { id: 'venue', label: 'Venue & Setup', icon: MapPin },
    { id: 'menu', label: 'Menu & Beverage', icon: Utensils },
    { id: 'av', label: 'AV & Production', icon: Mic },
    { id: 'decor', label: 'Decor & Rentals', icon: Flower2 },
    { id: 'services', label: 'Additional Services', icon: Plus },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'review', label: 'Review & Save', icon: CheckCircle2 },
  ];

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addDecorItem = (optionId) => {
    const existing = form.decor.find((d) => d.optionId === optionId);
    if (existing) {
      setForm((prev) => ({
        ...prev,
        decor: prev.decor.map((d) => (d.optionId === optionId ? { ...d, qty: d.qty + 1 } : d)),
      }));
    } else {
      setForm((prev) => ({ ...prev, decor: [...prev.decor, { optionId, qty: 1 }] }));
    }
  };

  const removeDecorItem = (optionId) => {
    setForm((prev) => ({ ...prev, decor: prev.decor.filter((d) => d.optionId !== optionId) }));
  };

  const updateDecorQty = (optionId, qty) => {
    if (qty < 1) {
      removeDecorItem(optionId);
      return;
    }
    setForm((prev) => ({
      ...prev,
      decor: prev.decor.map((d) => (d.optionId === optionId ? { ...d, qty } : d)),
    }));
  };

  const addService = () => {
    if (!newService.name.trim() || !newService.price) return;
    setForm((prev) => ({
      ...prev,
      additionalServices: [
        ...prev.additionalServices,
        { name: newService.name.trim(), price: Number(newService.price) },
      ],
    }));
    setNewService({ name: '', price: '' });
  };

  const removeService = (idx) => {
    setForm((prev) => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== idx),
    }));
  };

  const addTimelineItem = () => {
    if (!newTimelineItem.time.trim() || !newTimelineItem.activity.trim()) return;
    setForm((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { ...newTimelineItem }].sort((a, b) =>
        a.time.localeCompare(b.time)
      ),
    }));
    setNewTimelineItem({ time: '', activity: '', dept: 'Banquet' });
  };

  const removeTimelineItem = (idx) => {
    setForm((prev) => ({ ...prev, timeline: prev.timeline.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    const beoData = {
      ...form,
      id:
        beo?.id ||
        `BEO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      createdAt: beo?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      menuPriceOverride: form.menuPriceOverride ? Number(form.menuPriceOverride) : undefined,
      avPriceOverride: form.avPriceOverride ? Number(form.avPriceOverride) : undefined,
    };
    onSave(beoData);
  };

  const totals = useMemo(() => calculateBeoTotal(form), [form]);
  const room = roomTypes.find((r) => r.id === form.roomId);
  const setup = setupOptions.find((s) => s.id === form.setupId);
  const menuPkg = menuPackages.find((p) => p.id === form.menuPackageId);
  const avPkg = avPackages.find((p) => p.id === form.avPackageId);

  const canProceed = () => {
    if (activeStep === 0) return form.eventName && form.clientName && form.date;
    if (activeStep === 1) return form.roomId && form.setupId;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-background shadow-2xl rounded-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {isEditing ? 'Edit BEO' : 'Create New BEO'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEditing ? `Editing ${beo.id}` : 'Build a new Banquet Event Order'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border bg-surface px-6 py-3 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === activeStep;
              const isComplete = idx < activeStep;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isComplete && setActiveStep(idx)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-secondary/10 text-secondary'
                        : isComplete
                          ? 'text-accent hover:bg-accent/10'
                          : 'text-text-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                        isActive
                          ? 'bg-secondary text-white'
                          : isComplete
                            ? 'bg-accent text-white'
                            : 'bg-border text-text-muted'
                      )}
                    >
                      {isComplete ? <Check className="h-3 w-3" /> : idx + 1}
                    </div>
                    {step.label}
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-text-muted mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeStep === 0 && (
            <div className="space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Event Name *</label>
                  <Input
                    value={form.eventName}
                    onChange={(e) => updateForm('eventName', e.target.value)}
                    placeholder="e.g. Smith Wedding Reception"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Event Type</label>
                  <select
                    value={form.eventType}
                    onChange={(e) => updateForm('eventType', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Object.entries(eventTypes).map(([key, t]) => (
                      <option key={key} value={key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Client Name *</label>
                  <Input
                    value={form.clientName}
                    onChange={(e) => updateForm('clientName', e.target.value)}
                    placeholder="Primary contact name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Company</label>
                  <Input
                    value={form.company}
                    onChange={(e) => updateForm('company', e.target.value)}
                    placeholder="Company or organization"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Email</label>
                  <Input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => updateForm('clientEmail', e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Phone</label>
                  <Input
                    value={form.clientPhone}
                    onChange={(e) => updateForm('clientPhone', e.target.value)}
                    placeholder="+1 555-0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Event Date *</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm('date', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Start Time</label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => updateForm('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">End Time</label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => updateForm('endTime', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Guest Count</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.guestCount}
                    onChange={(e) => updateForm('guestCount', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    Assigned Planner
                  </label>
                  <Input
                    value={form.assignedPlanner}
                    onChange={(e) => updateForm('assignedPlanner', e.target.value)}
                    placeholder="Planner name"
                  />
                </div>
              </div>
            </div>
          )}
          {activeStep === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Select Room</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roomTypes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => updateForm('roomId', r.id)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                        form.roomId === r.id
                          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                          : 'border-border bg-surface'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-text-primary">{r.name}</span>
                        {form.roomId === r.id && (
                          <CheckCircle2 className="h-4 w-4 text-secondary" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted">
                        Capacity: {r.capacity} &middot; {r.sqft?.toLocaleString()} sq ft
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.features?.map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent border border-accent/20"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Room Setup</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {setupOptions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => updateForm('setupId', s.id)}
                        className={cn(
                          'rounded-xl border p-4 text-center transition-all hover:shadow-md',
                          form.setupId === s.id
                            ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                            : 'border-border bg-surface'
                        )}
                      >
                        <Icon
                          className={cn(
                            'mx-auto h-6 w-6 mb-2',
                            form.setupId === s.id ? 'text-secondary' : 'text-text-muted'
                          )}
                        />
                        <span className="text-xs font-medium text-text-primary">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {activeStep === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Menu Package</h3>
                <div className="grid grid-cols-1 gap-3">
                  {menuPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => updateForm('menuPackageId', pkg.id)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                        form.menuPackageId === pkg.id
                          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                          : 'border-border bg-surface'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">
                            {pkg.name}
                          </span>
                          {form.menuPackageId === pkg.id && (
                            <CheckCircle2 className="h-4 w-4 text-secondary" />
                          )}
                        </div>
                        <span className="text-sm font-bold font-mono text-secondary">
                          {formatCurrency(pkg.pricePerPerson)}{' '}
                          <span className="text-xs font-normal text-text-muted">/ person</span>
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {pkg.courses?.map((course, i) => (
                          <div key={i} className="text-xs text-text-secondary">
                            <span className="font-medium text-text-muted">{course.course}:</span>{' '}
                            {course.items.join(', ')}
                          </div>
                        ))}
                      </div>
                      {pkg.includes && (
                        <div className="mt-2 pt-2 border-t border-border text-xs text-text-muted">
                          Includes: {pkg.includes.join(', ')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Price Override (Optional)
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-muted">Override per-person rate:</span>
                  <Input
                    type="number"
                    min={0}
                    value={form.menuPriceOverride}
                    onChange={(e) => updateForm('menuPriceOverride', e.target.value)}
                    placeholder={String(menuPkg?.pricePerPerson || 0)}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          )}
          {activeStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  AV & Production Package
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {avPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => updateForm('avPackageId', pkg.id)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                        form.avPackageId === pkg.id
                          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                          : 'border-border bg-surface'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">
                            {pkg.name}
                          </span>
                          {form.avPackageId === pkg.id && (
                            <CheckCircle2 className="h-4 w-4 text-secondary" />
                          )}
                        </div>
                        <span className="text-sm font-bold font-mono text-secondary">
                          {formatCurrency(pkg.price)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {pkg.items?.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-text-secondary"
                          >
                            <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Price Override (Optional)
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-muted">Override package price:</span>
                  <Input
                    type="number"
                    min={0}
                    value={form.avPriceOverride}
                    onChange={(e) => updateForm('avPriceOverride', e.target.value)}
                    placeholder={String(avPkg?.price || 0)}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          )}
          {activeStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Decor & Rentals</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {decorOptions.map((opt) => {
                    const Icon = opt.icon;
                    const existing = form.decor.find((d) => d.optionId === opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          'rounded-xl border p-4 transition-all',
                          existing ? 'border-secondary bg-secondary/5' : 'border-border bg-surface'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                              <Icon className="h-4 w-4 text-secondary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{opt.name}</p>
                              <p className="text-xs text-text-muted">
                                {formatCurrency(opt.price)} {opt.unit}
                              </p>
                            </div>
                          </div>
                          {existing && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateDecorQty(opt.id, existing.qty - 1)}
                                className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">
                                {existing.qty}
                              </span>
                              <button
                                onClick={() => updateDecorQty(opt.id, existing.qty + 1)}
                                className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          {!existing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addDecorItem(opt.id)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        {existing && (
                          <p className="text-xs text-text-muted text-right mt-1">
                            Line total: {formatCurrency(opt.price * existing.qty)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Decor Subtotal</h3>
                <p className="text-xl font-bold font-mono text-secondary">
                  {formatCurrency(totals.decorTotal)}
                </p>
              </div>
            </div>
          )}
          {activeStep === 5 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Additional Services
                </h3>
                <div className="flex gap-3 mb-4">
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Service name (e.g. Champagne Toast)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={newService.price}
                    onChange={(e) => setNewService((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="Price"
                    className="w-32"
                  />
                  <Button onClick={addService} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.additionalServices.map((svc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                    >
                      <span className="text-sm text-text-primary">{svc.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-text-primary">
                          {formatCurrency(svc.price)}
                        </span>
                        <button
                          onClick={() => removeService(i)}
                          className="rounded-md p-1 hover:bg-danger/10 text-text-muted hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.additionalServices.length === 0 && (
                    <div className="text-center py-6 text-text-muted text-sm">
                      No additional services added yet
                    </div>
                  )}
                </div>
                {form.additionalServices.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border flex justify-between">
                    <span className="text-sm font-medium text-text-primary">Services Subtotal</span>
                    <span className="text-sm font-bold font-mono text-text-primary">
                      {formatCurrency(totals.servicesTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeStep === 6 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Event Day Timeline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <Input
                    type="time"
                    value={newTimelineItem.time}
                    onChange={(e) =>
                      setNewTimelineItem((prev) => ({ ...prev, time: e.target.value }))
                    }
                    placeholder="Time"
                  />
                  <Input
                    value={newTimelineItem.activity}
                    onChange={(e) =>
                      setNewTimelineItem((prev) => ({ ...prev, activity: e.target.value }))
                    }
                    placeholder="Activity description"
                    className="sm:col-span-2"
                  />
                </div>
                <div className="flex gap-3 mb-4">
                  <select
                    value={newTimelineItem.dept}
                    onChange={(e) =>
                      setNewTimelineItem((prev) => ({ ...prev, dept: e.target.value }))
                    }
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Banquet">Banquet</option>
                    <option value="Culinary">Culinary</option>
                    <option value="AV">AV</option>
                    <option value="Security">Security</option>
                    <option value="Housekeeping">Housekeeping</option>
                  </select>
                  <Button onClick={addTimelineItem} size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Timeline Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.timeline.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary shrink-0">
                        {item.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {item.activity}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent border border-accent/20">
                          {item.dept}
                        </span>
                      </div>
                      <button
                        onClick={() => removeTimelineItem(i)}
                        className="rounded-md p-1 hover:bg-danger/10 text-text-muted hover:text-danger shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.timeline.length === 0 && (
                    <div className="text-center py-6 text-text-muted text-sm">
                      No timeline items yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeStep === 7 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  BEO Summary
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-text-muted">Event Name</p>
                      <p className="font-medium text-text-primary">{form.eventName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Event Type</p>
                      <p className="font-medium text-text-primary">
                        {eventTypes[form.eventType]?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Date & Time</p>
                      <p className="font-medium text-text-primary">
                        {form.date} &middot; {form.startTime} &ndash; {form.endTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Guest Count</p>
                      <p className="font-medium text-text-primary">{form.guestCount} guests</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Room</p>
                      <p className="font-medium text-text-primary">{room?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Setup</p>
                      <p className="font-medium text-text-primary">{setup?.name}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Financial Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Room Rental</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(totals.roomPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Room Setup</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(totals.setupPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      Menu & Beverage ({form.guestCount} guests)
                    </span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(totals.menuPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">AV & Production</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(totals.avPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Decor & Rentals</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(totals.decorTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Additional Services</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(totals.servicesTotal)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-sm">
                    <span className="font-medium text-text-primary">Subtotal</span>
                    <span className="font-mono font-medium text-text-primary">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Tax (8.75%)</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(totals.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Gratuity (22% on food)</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(totals.gratuity)}
                    </span>
                  </div>
                  <div className="pt-2 border-t-2 border-border flex justify-between">
                    <span className="text-base font-bold text-text-primary">Grand Total</span>
                    <span className="text-xl font-bold font-mono text-secondary">
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted text-right">
                    {form.guestCount > 0
                      ? formatCurrency(totals.grandTotal / form.guestCount)
                      : '$0.00'}{' '}
                    per person
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Status
                </h3>
                <div className="flex gap-3">
                  {Object.entries(beoStatuses)
                    .filter(([k]) => k !== 'cancelled')
                    .map(([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => updateForm('status', key)}
                        className={cn(
                          'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                          form.status === key
                            ? meta.class
                            : 'border-border bg-background text-text-secondary hover:text-text-primary'
                        )}
                      >
                        {meta.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-surface px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <Button variant="outline" onClick={() => setActiveStep((prev) => prev - 1)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeStep < steps.length - 1 ? (
              <Button onClick={() => setActiveStep((prev) => prev + 1)} disabled={!canProceed()}>
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSave}>
                <Save className="mr-1.5 h-4 w-4" /> {isEditing ? 'Update BEO' : 'Create BEO'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SalesCateringBeosPage() {
  const [beos, setBeos] = useState(initialBeos);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [selectedBeo, setSelectedBeo] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingBeo, setEditingBeo] = useState(null);

  const filteredBeos = useMemo(() => {
    return beos.filter((beo) => {
      const matchesQuery =
        !query ||
        beo.eventName.toLowerCase().includes(query.toLowerCase()) ||
        beo.clientName.toLowerCase().includes(query.toLowerCase()) ||
        beo.company?.toLowerCase().includes(query.toLowerCase()) ||
        beo.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || beo.status === statusFilter;
      const matchesType = typeFilter === 'all' || beo.eventType === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [beos, query, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: beos.length,
      confirmed: beos.filter((b) => b.status === 'confirmed').length,
      pending: beos.filter((b) => b.status === 'pending' || b.status === 'draft').length,
      revenue: beos
        .filter((b) => b.status === 'confirmed')
        .reduce((sum, b) => sum + calculateBeoTotal(b).grandTotal, 0),
    }),
    [beos]
  );

  const handleSaveBeo = (beoData) => {
    setBeos((prev) => {
      const exists = prev.find((b) => b.id === beoData.id);
      if (exists) {
        return prev.map((b) =>
          b.id === beoData.id ? { ...beoData, updatedAt: new Date().toISOString() } : b
        );
      }
      return [beoData, ...prev];
    });
    setShowBuilder(false);
    setEditingBeo(null);
  };

  const handleDuplicate = (beo) => {
    const duplicated = {
      ...beo,
      id: `BEO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      eventName: `${beo.eventName} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setBeos((prev) => [duplicated, ...prev]);
  };

  const handleDelete = (id) => {
    setBeos((prev) => prev.filter((b) => b.id !== id));
    setView('list');
    setSelectedBeo(null);
  };

  const handleStatusChange = (id, status) => {
    setBeos((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b))
    );
  };

  const handleSelectBeo = (beo) => {
    setSelectedBeo(beo);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedBeo(null);
  };

  // ─── Detail View ───
  if (view === 'detail' && selectedBeo) {
    return (
      <BeoDetailPage
        beo={selectedBeo}
        onBack={handleBackToList}
        onEdit={(beo) => {
          setEditingBeo(beo);
          setShowBuilder(true);
        }}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    );
  }

  // ─── List View ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Banquet Event Orders</h1>
          <p className="text-sm text-text-secondary">
            Create and manage BEOs for events and catering
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingBeo(null);
            setShowBuilder(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> New BEO
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total BEOs"
          value={stats.total}
          icon={ClipboardList}
          color="text-secondary"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={CheckCircle2}
          color="text-accent"
        />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="text-warning" />
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
          color="text-info"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search BEOs, clients, events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="revisions">Revisions</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            {Object.entries(eventTypes).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-secondary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-secondary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">
                    BEO / Event
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Guests</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Total</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBeos.map((beo) => {
                  const totals = calculateBeoTotal(beo);
                  const eventMeta = getEventTypeMeta(beo.eventType);
                  const EventIcon = eventMeta.icon;
                  return (
                    <tr
                      key={beo.id}
                      onClick={() => handleSelectBeo(beo)}
                      className="hover:bg-background/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg',
                              eventMeta.bg
                            )}
                          >
                            <EventIcon className={cn('h-4 w-4', eventMeta.color)} />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{beo.eventName}</p>
                            <p className="text-xs text-text-muted">
                              {beo.id} &middot; {beo.clientName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {beo.date}
                        <br />
                        {beo.startTime} &ndash; {beo.endTime}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border',
                            eventMeta.bg,
                            eventMeta.color,
                            eventMeta.bg.replace('/10', '/20')
                          )}
                        >
                          {eventMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={beo.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {beo.guestCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                        {formatCurrency(totals.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      </td>
                    </tr>
                  );
                })}
                {filteredBeos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                      <ClipboardList className="mx-auto h-10 w-10 mb-3" />
                      <p>No BEOs match your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBeos.map((beo) => {
            const totals = calculateBeoTotal(beo);
            const eventMeta = getEventTypeMeta(beo.eventType);
            const EventIcon = eventMeta.icon;
            return (
              <div
                key={beo.id}
                onClick={() => handleSelectBeo(beo)}
                className="rounded-xl border border-border bg-surface p-5 cursor-pointer transition-all hover:border-secondary/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      eventMeta.bg
                    )}
                  >
                    <EventIcon className={cn('h-5 w-5', eventMeta.color)} />
                  </div>
                  <StatusBadge status={beo.status} />
                </div>
                <h3 className="font-semibold text-text-primary mb-1">{beo.eventName}</h3>
                <p className="text-xs text-text-muted">
                  {beo.clientName} &middot; {beo.company || 'Individual'}
                </p>
                <div className="mt-3 space-y-1.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    {beo.date} &middot; {beo.startTime} &ndash; {beo.endTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-text-muted" />
                    {beo.guestCount} guests
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-text-muted" />
                    {roomTypes.find((r) => r.id === beo.roomId)?.name}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-muted">Total</span>
                  <span className="text-sm font-bold font-mono text-text-primary">
                    {formatCurrency(totals.grandTotal)}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredBeos.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No BEOs match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Builder Modal */}
      {showBuilder && (
        <BeoBuilderModal
          beo={editingBeo}
          onClose={() => {
            setShowBuilder(false);
            setEditingBeo(null);
          }}
          onSave={handleSaveBeo}
        />
      )}
    </div>
  );
}
