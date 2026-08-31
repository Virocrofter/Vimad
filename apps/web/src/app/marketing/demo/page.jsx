import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, Clock, Check, ChevronLeft, ChevronRight,
  User, Building2, BedDouble, Phone, Mail, HelpCircle, Loader2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

const currentPMSOptions = [
  'Oracle OPERA 5',
  'Hilton OnQ',
  'Cloudbeds',
  'Mews',
  'Protel',
  'eZee FrontDesk',
  'None / Manual',
  'Other',
];

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  const startOffset = firstDay.getDay();
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  return days;
}

export default function DemoRequestPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState('pick');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    hotelName: '',
    roomCount: '',
    currentPMS: '',
    phone: '',
    email: '',
  });

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  const calendarDays = generateCalendarDays(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isDateDisabled = (day) => {
    const d = new Date(year, month, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d < now || d.getDay() === 0 || d.getDay() === 6;
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    setStep('success');
  };

  const selectedDateStr = selectedDate
    ? new Date(year, month, selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <Calendar className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">Request a Personalized Demo</h1>
          <p className="mt-2 text-text-secondary">See how Unified PMS works for your property in a 30-minute walkthrough.</p>
        </div>

        {step === 'success' ? (
          <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-6 w-6 text-accent" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-text-primary">Demo Scheduled!</h2>
            <p className="mt-2 text-sm text-text-secondary">
              We've received your request for <strong className="text-text-primary">{selectedDateStr}</strong> at <strong className="text-text-primary">{selectedTime}</strong>.
            </p>
            <p className="mt-1 text-sm text-text-muted">
              A confirmation email has been sent to {formData.email}. Our team will call you at {formData.phone} a few minutes before the demo.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-secondary px-6 text-sm font-medium text-white hover:bg-secondary/90"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Calendar + Time */}
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-secondary" /> Select a Date
                  </h2>
                  <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-surface-elevated">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-text-primary w-32 text-center">{monthName}</span>
                    <button onClick={nextMonth} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-surface-elevated">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-muted mb-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;
                    const disabled = isDateDisabled(day);
                    const active = selectedDate === day;
                    return (
                      <button
                        key={day}
                        disabled={disabled}
                        onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                        className={cn(
                          'h-10 rounded-md text-sm font-medium transition-colors',
                          disabled && 'text-text-muted opacity-40 cursor-not-allowed',
                          !disabled && !active && 'text-text-primary hover:bg-surface-elevated',
                          active && 'bg-secondary text-white'
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-secondary" /> Available Times for {selectedDateStr}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                          selectedTime === time
                            ? 'border-secondary bg-secondary/10 text-secondary'
                            : 'border-border text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form / Expectation */}
            <div className="lg:col-span-2">
              {step === 'pick' ? (
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-semibold text-text-primary">What to Expect</h3>
                  <ul className="space-y-3 text-sm text-text-secondary">
                    <li className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">1</div>
                      <span><strong className="text-text-primary">30-minute walkthrough</strong> tailored to your property type and size.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">2</div>
                      <span><strong className="text-text-primary">Live Q&A</strong> with a product specialist who knows hospitality operations.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">3</div>
                      <span><strong className="text-text-primary">Custom pricing quote</strong> based on your room count and needed integrations.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">4</div>
                      <span><strong className="text-text-primary">No pressure, no commitment.</strong> Just a transparent look at the platform.</span>
                    </li>
                  </ul>
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <p className="text-xs text-accent font-medium flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Prefer to talk now? Call us at +1-800-555-1234
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep('form')}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary">Your Details</h3>
                    <button type="button" onClick={() => setStep('pick')} className="text-xs text-secondary hover:underline">
                      Back to calendar
                    </button>
                  </div>
                  <p className="text-xs text-text-muted">{selectedDateStr} at {selectedTime}</p>

                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    icon={User}
                    required
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                  <Input
                    label="Hotel Name"
                    placeholder="Grand Plaza Hotel"
                    icon={Building2}
                    required
                    value={formData.hotelName}
                    onChange={(e) => handleFormChange('hotelName', e.target.value)}
                  />
                  <Input
                    label="Room Count"
                    type="number"
                    placeholder="50"
                    icon={BedDouble}
                    required
                    value={formData.roomCount}
                    onChange={(e) => handleFormChange('roomCount', e.target.value)}
                  />

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-primary">Current PMS</label>
                    <select
                      required
                      value={formData.currentPMS}
                      onChange={(e) => handleFormChange('currentPMS', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select your current system</option>
                      {currentPMSOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    icon={Phone}
                    required
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@property.com"
                    icon={Mail}
                    required
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />

                  <Button type="submit" className="w-full" isLoading={isSubmitting}>
                    Schedule Demo
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}