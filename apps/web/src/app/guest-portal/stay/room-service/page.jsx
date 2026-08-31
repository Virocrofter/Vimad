/* src/app/guest-portal/stay/room-service/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Coffee, UtensilsCrossed, Wine, Sparkles,
  Search, X, Plus, Minus, CheckCircle2, Clock, ChevronRight,
  Filter, Star, AlertTriangle, Info
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useGuestStore } from '../../store';
import { roomServiceMenu, formatCurrency, isMenuAvailable } from '../../data';
import { MenuCategoryCard, MenuItemCard } from '../../components';
import { CartSummary, OrderStatusCard } from './components';

export default function RoomServicePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { cart, addToCart, removeFromCart, updateCartQty, clearCart, addOrder, getCartTotal, getCartCount } = useGuestStore();

  const categories = roomServiceMenu.categories;

  const allItems = useMemo(() => {
    return categories.flatMap(cat => cat.items.map(item => ({ ...item, categoryId: cat.id, categoryName: cat.name })));
  }, [categories]);

  const filteredItems = useMemo(() => {
    let items = activeCategory
      ? categories.find(c => c.id === activeCategory)?.items || []
      : allItems;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.dietary.some(d => d.toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeCategory, searchQuery, allItems, categories]);

  const cartQtyMap = useMemo(() => {
    const map = {};
    cart.forEach(item => { map[item.id] = item.qty; });
    return map;
  }, [cart]);

  const handleAddToCart = (item) => {
    addToCart({ ...item, qty: 1 });
  };

  const handleUpdateQty = (itemId, qty) => {
    if (qty <= 0) {
      removeFromCart(itemId);
    } else {
      updateCartQty(itemId, qty);
    }
  };

  const handleCheckout = () => {
    const newOrder = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      type: 'room_service',
      status: 'pending',
      orderedAt: new Date().toISOString(),
      items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
      total: getCartTotal(),
    };
    addOrder(newOrder);
    clearCart();
    setOrderPlaced(true);
    setShowCart(false);
    setTimeout(() => setOrderPlaced(false), 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/stay')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Room Service</h1>
          <p className="text-xs text-text-muted">Delivered to Room 204</p>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ShoppingCart className="h-5 w-5 text-text-primary" />
          {getCartCount() > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">
              {getCartCount()}
            </span>
          )}
        </button>
      </div>

      {/* Order Placed Toast */}
      {orderPlaced && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">Order Placed!</p>
            <p className="text-xs text-text-secondary">Your order is being prepared and will be delivered to Room 204.</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        )}
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((category) => {
            const available = isMenuAvailable(category);
            return (
              <MenuCategoryCard
                key={category.id}
                category={category}
                isAvailable={available}
                onSelect={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
              />
            );
          })}
        </div>
      )}

      {/* Active Category / All Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">
            {activeCategory
              ? categories.find(c => c.id === activeCategory)?.name
              : searchQuery
                ? `Search Results (${filteredItems.length})`
                : 'All Items'
            }
          </h2>
          {(activeCategory || searchQuery) && (
            <button
              onClick={() => { setActiveCategory(null); setSearchQuery(''); }}
              className="text-xs text-secondary hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No items found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={cartQtyMap[item.id] || 0}
                onAdd={handleAddToCart}
                onUpdateQty={handleUpdateQty}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer (Mobile) / Sidebar (Desktop) */}
      {showCart && (
        <div className="fixed inset-0 z-50 sm:relative sm:inset-auto">
          <div className="absolute inset-0 bg-black/50 sm:hidden" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 sm:static sm:w-full rounded-t-xl sm:rounded-xl border border-border bg-background shadow-2xl sm:shadow-none max-h-[80vh] sm:max-h-none overflow-auto">
            <div className="sticky top-0 bg-background z-10 border-b border-border p-4 flex items-center justify-between sm:hidden">
              <h3 className="text-sm font-semibold text-text-primary">Your Order</h3>
              <button onClick={() => setShowCart(false)}>
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <div className="p-4">
              <CartSummary
                items={cart}
                total={getCartTotal()}
                onCheckout={handleCheckout}
                onClear={clearCart}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      {getCartCount() > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 left-6 right-6 z-40 sm:hidden rounded-xl bg-secondary py-3 px-4 text-sm font-medium text-white shadow-lg flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {getCartCount()} items
          </span>
          <span>{formatCurrency(getCartTotal())}</span>
        </button>
      )}
    </div>
  );
}
