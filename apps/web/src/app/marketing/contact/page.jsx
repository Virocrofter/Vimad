import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, MapPin, Check, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

export default function ContactPage() {
  const [status, setStatus] = useState('idle');
  const [form, setForm] = useState({ name: '', email: '', hotel: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => setStatus('success'), 1500);
  };

  if (status === 'success') {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Check className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-text-primary">Message sent!</h2>
          <p className="mt-2 text-text-secondary">We will get back to you within 24 hours.</p>
          <Link to="/" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-secondary px-6 text-sm font-medium text-white hover:bg-secondary/90">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold text-text-primary sm:text-5xl">Get in touch</h1>
              <p className="mt-4 text-lg text-text-secondary">
                Have a question about pricing, migration, or enterprise features? We are here to help.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-text-secondary">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <Phone className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Phone</p>
                    <p className="text-sm">+1-800-555-1234</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <Mail className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Email</p>
                    <p className="text-sm">hello@unifiedpms.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <MapPin className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Headquarters</p>
                    <p className="text-sm">123 Hospitality Way, San Francisco, CA 94105</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-4">
              <Input
                label="Name"
                placeholder="John Doe"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@property.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Property Name"
                placeholder="Grand Plaza Hotel"
                value={form.hotel}
                onChange={e => setForm({ ...form, hotel: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" className="w-full" isLoading={status === 'loading'}>
                <MessageSquare className="mr-1.5 h-4 w-4" /> Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}