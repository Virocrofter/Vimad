/* src/app/app/marketing/templates/page.jsx */
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutTemplate, Type, Image as ImageIcon, MousePointerClick,
  Columns, Minus, Star, ShoppingBag, Calendar, MapPin,
  ChevronLeft, Eye, Monitor, Smartphone, Moon, Sun, Clock,
  Plus, Trash2, Copy, Move, GripVertical, Settings,
  Undo, Redo, Download, Save, Check, X, Palette,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  Link as LinkIcon, Upload, Layers
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

/* ─── Block Types ─── */
const BLOCK_TYPES = [
  { id: 'header', label: 'Header', icon: Type, category: 'content' },
  { id: 'text', label: 'Text Block', icon: AlignLeft, category: 'content' },
  { id: 'image', label: 'Image', icon: ImageIcon, category: 'content' },
  { id: 'button', label: 'CTA Button', icon: MousePointerClick, category: 'content' },
  { id: 'divider', label: 'Divider', icon: Minus, category: 'layout' },
  { id: 'spacer', label: 'Spacer', icon: Layers, category: 'layout' },
  { id: 'two-col', label: 'Two Columns', icon: Columns, category: 'layout' },
  { id: 'hero', label: 'Hero Section', icon: Star, category: 'prebuilt' },
  { id: 'promo', label: 'Promo Card', icon: ShoppingBag, category: 'prebuilt' },
  { id: 'event', label: 'Event Block', icon: Calendar, category: 'prebuilt' },
];

const DEFAULT_BLOCKS = {
  header: {
    type: 'header',
    content: 'Your Hotel Name',
    styles: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#0F172A',
      align: 'center',
      padding: '24px',
      backgroundColor: 'transparent',
    },
  },
  text: {
    type: 'text',
    content: 'Write your message here...',
    styles: {
      fontSize: '16px',
      fontWeight: 'normal',
      color: '#475569',
      align: 'left',
      padding: '16px 24px',
      lineHeight: '1.6',
    },
  },
  image: {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=300&fit=crop',
    alt: 'Hotel image',
    styles: {
      padding: '0',
      align: 'center',
      borderRadius: '8px',
    },
  },
  button: {
    type: 'button',
    content: 'Book Now',
    url: '#',
    styles: {
      backgroundColor: '#3B82F6',
      color: '#FFFFFF',
      fontSize: '16px',
      fontWeight: '600',
      padding: '14px 32px',
      borderRadius: '8px',
      align: 'center',
    },
  },
  divider: {
    type: 'divider',
    styles: {
      color: '#E2E8F0',
      height: '1px',
      padding: '16px 24px',
    },
  },
  spacer: {
    type: 'spacer',
    styles: {
      height: '32px',
    },
  },
  'two-col': {
    type: 'two-col',
    left: { type: 'text', content: 'Left column content...', styles: { fontSize: '14px', color: '#475569', padding: '16px' } },
    right: { type: 'text', content: 'Right column content...', styles: { fontSize: '14px', color: '#475569', padding: '16px' } },
    styles: { padding: '0', gap: '0' },
  },
  hero: {
    type: 'hero',
    headline: 'Experience Luxury Like Never Before',
    subheadline: 'Book your stay today and save 25% on your first reservation.',
    buttonText: 'Reserve Now',
    imageSrc: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=300&fit=crop',
    styles: {
      padding: '0',
      textAlign: 'center',
      overlayColor: 'rgba(0,0,0,0.4)',
      textColor: '#FFFFFF',
    },
  },
  promo: {
    type: 'promo',
    title: 'Summer Special Offer',
    description: 'Get 30% off all suite bookings this July. Limited availability.',
    code: 'SUMMER30',
    expiry: 'Jul 31, 2026',
    styles: {
      padding: '24px',
      backgroundColor: '#F0F9FF',
      borderColor: '#3B82F6',
      borderWidth: '2px',
      borderRadius: '12px',
    },
  },
  event: {
    type: 'event',
    title: 'Wine Tasting Evening',
    date: 'Aug 20, 2026',
    time: '7:00 PM',
    location: 'Rooftop Lounge',
    description: 'Join us for an exclusive wine tasting event featuring local vineyards.',
    styles: {
      padding: '20px',
      backgroundColor: '#FAF5FF',
      borderColor: '#A855F7',
      borderWidth: '1px',
      borderRadius: '12px',
    },
  },
};

/* ─── Sample Templates ─── */
const SAMPLE_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    thumbnail: '🎉',
    blocks: [
      { ...DEFAULT_BLOCKS.header, content: 'Welcome to Grand Hotel!' },
      { ...DEFAULT_BLOCKS.hero, headline: 'Your Journey Begins Here', subheadline: 'We\'re thrilled to have you. Here\'s everything you need to know.', buttonText: 'View Your Reservation' },
      { ...DEFAULT_BLOCKS.text, content: 'Thank you for choosing Grand Hotel. We\'ve prepared a special welcome package for your arrival. Our concierge team is available 24/7 to make your stay unforgettable.' },
      { ...DEFAULT_BLOCKS.button, content: 'Contact Concierge' },
      { ...DEFAULT_BLOCKS.divider },
      { ...DEFAULT_BLOCKS.text, content: 'Need help? Reply to this email or call us at +1 (555) 123-4567.', styles: { ...DEFAULT_BLOCKS.text.styles, fontSize: '12px', color: '#94A3B8', align: 'center' } },
    ],
  },
  {
    id: 'promo',
    name: 'Promotional Offer',
    thumbnail: '🏷️',
    blocks: [
      { ...DEFAULT_BLOCKS.header, content: 'Exclusive Offer Inside' },
      { ...DEFAULT_BLOCKS.promo, title: 'Weekend Flash Sale', description: 'Book any weekend in August and save 40% on your stay. Plus complimentary breakfast.', code: 'FLASH40', expiry: 'Aug 31, 2026' },
      { ...DEFAULT_BLOCKS.two_col, left: { type: 'image', src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=280&h=200&fit=crop', alt: 'Room', styles: { padding: '0' } }, right: { type: 'text', content: 'Our newly renovated Deluxe King rooms feature premium bedding, city views, and smart room controls.', styles: { fontSize: '14px', color: '#475569', padding: '16px' } } },
      { ...DEFAULT_BLOCKS.button, content: 'Book Now — Limited Time' },
    ],
  },
  {
    id: 'newsletter',
    name: 'Monthly Newsletter',
    thumbnail: '📰',
    blocks: [
      { ...DEFAULT_BLOCKS.header, content: 'August Newsletter' },
      { ...DEFAULT_BLOCKS.text, content: 'Discover what\'s new this month at our properties, from seasonal menus to exclusive events.' },
      { ...DEFAULT_BLOCKS.event, title: 'Jazz by the Pool', date: 'Aug 15, 2026', time: '6:00 PM', location: 'Poolside Terrace', description: 'Live jazz performances every Saturday evening. Cocktails and tapas available.' },
      { ...DEFAULT_BLOCKS.event, title: 'Chef\'s Table Experience', date: 'Aug 22, 2026', time: '7:30 PM', location: 'Main Restaurant', description: 'An intimate 8-course tasting menu with wine pairings. Only 12 seats available.' },
      { ...DEFAULT_BLOCKS.button, content: 'View All Events' },
    ],
  },
];

/* ─── Helpers ─── */
function generateId() {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ─── Block Renderer ─── */
function renderBlock(block, isSelected, isPreview, theme) {
  const baseClasses = cn(
    'relative transition-all',
    isSelected && !isPreview && 'ring-2 ring-secondary ring-offset-2',
    !isPreview && 'cursor-pointer hover:ring-1 hover:ring-secondary/50'
  );

  const isDark = theme === 'dark';

  switch (block.type) {
    case 'header':
      return (
        <div className={baseClasses} style={{ padding: block.styles.padding, backgroundColor: block.styles.backgroundColor, textAlign: block.styles.align }}>
          <h1 style={{
            fontSize: block.styles.fontSize,
            fontWeight: block.styles.fontWeight,
            color: isDark ? '#F8FAFC' : block.styles.color,
            margin: 0,
            lineHeight: 1.2,
          }}>
            {block.content}
          </h1>
        </div>
      );

    case 'text':
      return (
        <div className={baseClasses} style={{ padding: block.styles.padding }}>
          <p style={{
            fontSize: block.styles.fontSize,
            fontWeight: block.styles.fontWeight,
            color: isDark ? '#CBD5E1' : block.styles.color,
            textAlign: block.styles.align,
            lineHeight: block.styles.lineHeight,
            margin: 0,
          }}>
            {block.content}
          </p>
        </div>
      );

    case 'image':
      return (
        <div className={baseClasses} style={{ padding: block.styles.padding, textAlign: block.styles.align }}>
          <img
            src={block.src}
            alt={block.alt}
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: block.styles.borderRadius,
              display: 'inline-block',
            }}
          />
        </div>
      );

    case 'button':
      return (
        <div className={baseClasses} style={{ padding: block.styles.padding, textAlign: block.styles.align }}>
          <a
            href={block.url}
            style={{
              display: 'inline-block',
              backgroundColor: block.styles.backgroundColor,
              color: block.styles.color,
              fontSize: block.styles.fontSize,
              fontWeight: block.styles.fontWeight,
              padding: block.styles.padding,
              borderRadius: block.styles.borderRadius,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            {block.content}
          </a>
        </div>
      );

    case 'divider':
      return (
        <div className={baseClasses} style={{ padding: block.styles.padding }}>
          <div style={{
            height: block.styles.height,
            backgroundColor: isDark ? '#475569' : block.styles.color,
            width: '100%',
          }} />
        </div>
      );

    case 'spacer':
      return (
        <div className={baseClasses} style={{ height: block.styles.height }} />
      );

    case 'two-col':
      return (
        <div className={baseClasses} style={{ padding: block.styles.padding }}>
          <div style={{ display: 'flex', gap: block.styles.gap || '16px' }}>
            <div style={{ flex: 1 }}>
              {renderBlock(block.left, false, isPreview, theme)}
            </div>
            <div style={{ flex: 1 }}>
              {renderBlock(block.right, false, isPreview, theme)}
            </div>
          </div>
        </div>
      );

    case 'hero':
      return (
        <div className={baseClasses} style={{ position: 'relative', textAlign: block.styles.textAlign }}>
          <img
            src={block.imageSrc}
            alt="Hero"
            style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: block.styles.overlayColor,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32px',
          }}>
            <h2 style={{
              color: block.styles.textColor,
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 12px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              {block.headline}
            </h2>
            <p style={{
              color: block.styles.textColor,
              fontSize: '16px',
              margin: '0 0 20px 0',
              opacity: 0.9,
              maxWidth: '400px',
            }}>
              {block.subheadline}
            </p>
            <a
              href="#"
              style={{
                display: 'inline-block',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                padding: '12px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              {block.buttonText}
            </a>
          </div>
        </div>
      );

    case 'promo':
      return (
        <div className={baseClasses} style={{
          padding: block.styles.padding,
          backgroundColor: isDark ? '#1E293B' : block.styles.backgroundColor,
          border: `${block.styles.borderWidth} solid ${isDark ? '#3B82F6' : block.styles.borderColor}`,
          borderRadius: block.styles.borderRadius,
        }}>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: isDark ? '#F8FAFC' : '#0F172A', margin: '0 0 8px 0' }}>
            {block.title}
          </h3>
          <p style={{ fontSize: '15px', color: isDark ? '#CBD5E1' : '#475569', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            {block.description}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
            padding: '10px 16px',
            borderRadius: '6px',
            border: `1px dashed ${isDark ? '#3B82F6' : '#3B82F6'}`,
          }}>
            <span style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', color: '#3B82F6' }}>{block.code}</span>
          </div>
          <p style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#94A3B8', margin: '12px 0 0 0' }}>
            Expires {block.expiry}
          </p>
        </div>
      );

    case 'event':
      return (
        <div className={baseClasses} style={{
          padding: block.styles.padding,
          backgroundColor: isDark ? '#1E293B' : block.styles.backgroundColor,
          border: `${block.styles.borderWidth} solid ${isDark ? '#A855F7' : block.styles.borderColor}`,
          borderRadius: block.styles.borderRadius,
        }}>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: isDark ? '#F8FAFC' : '#0F172A', margin: '0 0 12px 0' }}>
            {block.title}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: isDark ? '#CBD5E1' : '#475569' }}>
              <Calendar className="h-3.5 w-3.5" style={{ display: 'inline' }} /> {block.date}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: isDark ? '#CBD5E1' : '#475569' }}>
              <Clock className="h-3.5 w-3.5" style={{ display: 'inline' }} /> {block.time}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: isDark ? '#CBD5E1' : '#475569' }}>
              <MapPin className="h-3.5 w-3.5" style={{ display: 'inline' }} /> {block.location}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: isDark ? '#94A3B8' : '#64748B', margin: 0, lineHeight: 1.5 }}>
            {block.description}
          </p>
        </div>
      );

    default:
      return null;
  }
}

/* ─── Property Inspector ─── */
function PropertyInspector({ block, onChange }) {
  if (!block) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Settings className="h-10 w-10 text-text-muted mb-3" />
        <p className="text-sm text-text-muted">Select a block to edit its properties</p>
      </div>
    );
  }

  const handleStyleChange = (key, value) => {
    onChange({
      ...block,
      styles: { ...block.styles, [key]: value },
    });
  };

  const handleContentChange = (key, value) => {
    onChange({ ...block, [key]: value });
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {BLOCK_TYPES.find(b => b.id === block.type)?.label || 'Block'} Properties
      </h3>

      {/* Content fields */}
      {block.content !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Content</label>
          <textarea
            value={block.content}
            onChange={(e) => handleContentChange('content', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
      )}

      {block.headline !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Headline</label>
          <input
            type="text"
            value={block.headline}
            onChange={(e) => handleContentChange('headline', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {block.subheadline !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Subheadline</label>
          <input
            type="text"
            value={block.subheadline}
            onChange={(e) => handleContentChange('subheadline', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {block.buttonText !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Button Text</label>
          <input
            type="text"
            value={block.buttonText}
            onChange={(e) => handleContentChange('buttonText', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {block.src !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Image URL</label>
          <input
            type="text"
            value={block.src}
            onChange={(e) => handleContentChange('src', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {block.url !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Button URL</label>
          <input
            type="text"
            value={block.url}
            onChange={(e) => handleContentChange('url', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {block.title !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Title</label>
          <input
            type="text"
            value={block.title}
            onChange={(e) => handleContentChange('title', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {block.description !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Description</label>
          <textarea
            value={block.description}
            onChange={(e) => handleContentChange('description', e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
      )}

      {block.code !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Promo Code</label>
          <input
            type="text"
            value={block.code}
            onChange={(e) => handleContentChange('code', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {/* Style fields */}
      <div className="border-t border-border pt-4 space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Styling</h4>

        {block.styles.align !== undefined && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Alignment</label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => handleStyleChange('align', align)}
                  className={cn(
                    'flex-1 h-8 rounded-md border text-xs font-medium transition-colors',
                    block.styles.align === align
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {block.styles.fontSize !== undefined && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Font Size</label>
            <input
              type="text"
              value={block.styles.fontSize}
              onChange={(e) => handleStyleChange('fontSize', e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}

        {block.styles.color !== undefined && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.styles.color}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="h-9 w-9 rounded-md border border-border cursor-pointer"
              />
              <input
                type="text"
                value={block.styles.color}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {block.styles.backgroundColor !== undefined && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.styles.backgroundColor === 'transparent' ? '#ffffff' : block.styles.backgroundColor}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="h-9 w-9 rounded-md border border-border cursor-pointer"
              />
              <input
                type="text"
                value={block.styles.backgroundColor}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {block.styles.padding !== undefined && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Padding</label>
            <input
              type="text"
              value={block.styles.padding}
              onChange={(e) => handleStyleChange('padding', e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}

        {block.styles.height !== undefined && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Height</label>
            <input
              type="text"
              value={block.styles.height}
              onChange={(e) => handleStyleChange('height', e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function TemplateBuilderPage() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState(deepClone(SAMPLE_TEMPLATES[0].blocks));
  const [selectedId, setSelectedId] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [previewTheme, setPreviewTheme] = useState('light'); // 'light' | 'dark'
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef(null);

  // Add block with unique ID
  const addBlock = (type) => {
    const newBlock = { ...deepClone(DEFAULT_BLOCKS[type]), id: generateId() };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedId(newBlock.id);
    pushHistory(newBlocks);
  };

  // Update block
  const updateBlock = (id, updatedBlock) => {
    const newBlocks = blocks.map(b => b.id === id ? updatedBlock : b);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
  };

  // Delete block
  const deleteBlock = (id) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    setSelectedId(null);
    pushHistory(newBlocks);
  };

  // Duplicate block
  const duplicateBlock = (id) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const newBlock = { ...deepClone(block), id: generateId() };
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)];
    setBlocks(newBlocks);
    setSelectedId(newBlock.id);
    pushHistory(newBlocks);
  };

  // Move block
  const moveBlock = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
  };

  // History management
  const pushHistory = (newBlocks) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newBlocks));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBlocks(JSON.parse(history[newIndex]));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBlocks(JSON.parse(history[newIndex]));
    }
  };

  // Load template
  const loadTemplate = (template) => {
    const newBlocks = deepClone(template.blocks).map(b => ({ ...b, id: generateId() }));
    setBlocks(newBlocks);
    setTemplateName(template.name);
    setShowTemplates(false);
    pushHistory(newBlocks);
  };

  // Selected block
  const selectedBlock = blocks.find(b => b.id === selectedId);

  // Drag handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (index) => {
    if (draggedIndex === null) return;
    moveBlock(draggedIndex, index);
    setDraggedIndex(null);
  };

  // Export HTML
  const exportHtml = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateName}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;">
          <!-- Content blocks would be rendered here -->
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, '_').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col -m-4 -mt-0 lg:-m-8 lg:-mt-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/marketing')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-surface-elevated"
          >
            <ChevronLeft className="h-4 w-4 text-text-secondary" />
          </button>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="h-8 rounded-md border-0 bg-transparent px-2 text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <span className="text-xs text-text-muted">Draft</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center rounded-md border border-border bg-background p-0.5">
            <button onClick={undo} className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated" title="Undo">
              <Undo className="h-3.5 w-3.5" />
            </button>
            <button onClick={redo} className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated" title="Redo">
              <Redo className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Templates */}
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Templates
          </Button>

          {/* Preview controls */}
          <div className="flex items-center rounded-md border border-border bg-background p-0.5">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded transition-colors',
                previewMode === 'desktop' ? 'bg-secondary text-white' : 'text-text-secondary hover:bg-surface-elevated'
              )}
              title="Desktop preview"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded transition-colors',
                previewMode === 'mobile' ? 'bg-secondary text-white' : 'text-text-secondary hover:bg-surface-elevated'
              )}
              title="Mobile preview"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light')}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors',
              previewTheme === 'dark' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-background text-text-secondary'
            )}
          >
            {previewTheme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            {previewTheme === 'dark' ? 'Dark' : 'Light'}
          </button>

          <Button variant="outline" size="sm" onClick={exportHtml}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm">
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Block palette */}
        <div className="w-56 border-r border-border bg-surface overflow-y-auto">
          <div className="p-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Content</h3>
            <div className="space-y-1">
              {BLOCK_TYPES.filter(b => b.category === 'content').map((blockType) => (
                <button
                  key={blockType.id}
                  onClick={() => addBlock(blockType.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
                >
                  <blockType.icon className="h-3.5 w-3.5" />
                  {blockType.label}
                </button>
              ))}
            </div>

            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 mt-4">Layout</h3>
            <div className="space-y-1">
              {BLOCK_TYPES.filter(b => b.category === 'layout').map((blockType) => (
                <button
                  key={blockType.id}
                  onClick={() => addBlock(blockType.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
                >
                  <blockType.icon className="h-3.5 w-3.5" />
                  {blockType.label}
                </button>
              ))}
            </div>

            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 mt-4">Pre-built</h3>
            <div className="space-y-1">
              {BLOCK_TYPES.filter(b => b.category === 'prebuilt').map((blockType) => (
                <button
                  key={blockType.id}
                  onClick={() => addBlock(blockType.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
                >
                  <blockType.icon className="h-3.5 w-3.5" />
                  {blockType.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center — Canvas */}
        <div
          ref={canvasRef}
          className={cn(
            'flex-1 overflow-y-auto p-8',
            previewTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#F1F5F9]'
          )}
        >
          <div
            className={cn(
              'mx-auto min-h-[600px] shadow-lg transition-all',
              previewMode === 'mobile' ? 'w-[375px]' : 'w-[600px]',
              previewTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'
            )}
            style={{ borderRadius: '12px', overflow: 'hidden' }}
          >
            {blocks.map((block, index) => (
              <div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onClick={() => setSelectedId(block.id)}
                className="relative group"
              >
                {/* Hover toolbar */}
                {!selectedId && (
                  <div className="absolute right-2 top-2 z-10 hidden items-center gap-1 rounded-md border border-border bg-background p-0.5 shadow-sm group-hover:flex">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveBlock(index, index - 1); }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated"
                      title="Move up"
                    >
                      <ChevronLeft className="h-3 w-3 -rotate-90" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveBlock(index, index + 1); }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated"
                      title="Move down"
                    >
                      <ChevronLeft className="h-3 w-3 rotate-90" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated"
                      title="Duplicate"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-danger/10 hover:text-danger"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Drag handle when selected */}
                {selectedId === block.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary cursor-move" title="Drag to reorder" />
                )}

                {renderBlock(block, selectedId === block.id, false, previewTheme)}
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
                <LayoutTemplate className="h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">Start building your email</p>
                <p className="text-xs text-text-muted mt-1">Add blocks from the sidebar</p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — Properties */}
        <div className="w-64 border-l border-border bg-surface overflow-y-auto">
          <PropertyInspector
            block={selectedBlock}
            onChange={(updated) => updateBlock(selectedId, updated)}
          />
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTemplates(false)} />
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Choose a Template</h2>
              <button onClick={() => setShowTemplates(false)} className="text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SAMPLE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template)}
                  className="rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-secondary/50 hover:shadow-md"
                >
                  <div className="text-3xl mb-3">{template.thumbnail}</div>
                  <h3 className="text-sm font-semibold text-text-primary">{template.name}</h3>
                  <p className="text-xs text-text-muted mt-1">{template.blocks.length} blocks</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
