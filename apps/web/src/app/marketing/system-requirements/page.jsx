import { Link } from 'react-router-dom';
import { Monitor, Smartphone, Wifi, HardDrive, Cpu, Globe } from 'lucide-react';

export default function SystemRequirementsPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <Monitor className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">System Requirements</h1>
          <p className="mt-2 text-text-secondary">
            Unified PMS is a cloud-native platform. No on-premise servers or complex IT setup
            required.
          </p>
        </div>

        <div className="space-y-8">
          {/* Desktop */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-semibold text-text-primary">Desktop & Laptop</h2>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-text-primary">
                      Requirement
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-primary">Minimum</th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-primary">
                      Recommended
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2.5 text-text-secondary">Operating System</td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      Windows 10, macOS 11, Ubuntu 20.04
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      Windows 11, macOS 14, Ubuntu 22.04
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-text-secondary">Browser</td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      Chrome 110, Firefox 110, Safari 16, Edge 110
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      Latest stable release of any major browser
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-text-secondary">RAM</td>
                    <td className="px-4 py-2.5 text-text-secondary">4 GB</td>
                    <td className="px-4 py-2.5 text-text-secondary">8 GB+</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-text-secondary">Display</td>
                    <td className="px-4 py-2.5 text-text-secondary">1280 × 720</td>
                    <td className="px-4 py-2.5 text-text-secondary">1920 × 1080 or higher</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-text-secondary">Internet</td>
                    <td className="px-4 py-2.5 text-text-secondary">2 Mbps down / 1 Mbps up</td>
                    <td className="px-4 py-2.5 text-text-secondary">10 Mbps down / 5 Mbps up</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-semibold text-text-primary">Mobile & Tablet</h2>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-text-primary">
                      Platform
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-primary">
                      Minimum Version
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-primary">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2.5 text-text-secondary">iOS</td>
                    <td className="px-4 py-2.5 text-text-secondary">iOS 16+</td>
                    <td className="px-4 py-2.5 text-text-secondary">iPhone, iPad, iPod Touch</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-text-secondary">Android</td>
                    <td className="px-4 py-2.5 text-text-secondary">Android 10+ (API 29)</td>
                    <td className="px-4 py-2.5 text-text-secondary">Phone and tablet optimized</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-text-secondary">PWA</td>
                    <td className="px-4 py-2.5 text-text-secondary">Any modern browser</td>
                    <td className="px-4 py-2.5 text-text-secondary">Installable to home screen</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Network */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-semibold text-text-primary">Network & Firewall</h2>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
              <li>
                Outbound HTTPS (port 443) to{' '}
                <code className="rounded bg-background px-1 py-0.5 font-mono text-xs text-secondary">
                  *.unifiedpms.com
                </code>
              </li>
              <li>WebSocket connections for real-time updates (port 443)</li>
              <li>No inbound ports required — fully cloud-hosted</li>
              <li>VPN compatibility: Works through most corporate VPNs</li>
            </ul>
          </section>

          {/* Peripherals */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-semibold text-text-primary">Supported Peripherals</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { name: 'Card Readers', desc: 'Stripe Reader M2, BBPOS WisePOS E' },
                { name: 'Receipt Printers', desc: 'Epson TM-T88V, Star TSP100' },
                { name: 'Barcode Scanners', desc: 'USB HID and Bluetooth models' },
                { name: 'ID Scanners', desc: 'Passport & driver license readers' },
              ].map((p) => (
                <div key={p.name} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
