/* apps/web/src/app/guest-portal/check-in/online/page.jsx — C4'b deep online check-in
 * Drives the gated backend: start → ID/selfie upload → documents → signature →
 * registration card → deposit → complete → key status. Token from guestPortalApi.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { toast } from '../../../../hooks/use-toast';
import { cn } from '../../../../lib/utils';
import { getGuestToken } from '../../../../hooks/guestPortalApi';
import { StepIndicator, FileUploadZone } from '../../components';
import {
  Camera,
  PenLine,
  FileCheck2,
  CreditCard,
  KeyRound,
  PartyPopper,
  ArrowLeft,
  ArrowRight,
  Download,
} from 'lucide-react';

const API_BASE = import.meta.env?.VITE_API_URL ?? '/api/v1';

const STEPS = ['Reservation', 'ID & selfie', 'Documents', 'Signature', 'Review & pay', 'Done'];

async function api(path, { method = 'GET', body } = {}) {
  const token = getGuestToken();
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error?.message ?? 'Request failed');
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json.data;
}

const toB64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function OnlineCheckinPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [conf, setConf] = useState('');
  const [docs, setDocs] = useState({ idDocType: 'passport', idDocNumber: '' });
  const [cardUrl, setCardUrl] = useState(null);
  const [deposit, setDeposit] = useState(null);
  const [key, setKey] = useState(null);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
      toast({ title: 'Check-in step failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const refresh = () =>
    run(async () => {
      if (!session) return;
      const s = await api('/guest-portal/checkin/sessions/' + session.id + '/key-status').catch(
        () => null
      );
      if (s) setKey(s);
    });

  const start = () =>
    run(async () => {
      const s = await api('/guest-portal/checkin/start', {
        method: 'POST',
        body: { confirmationNumber: conf.trim() },
      });
      setSession(s);
      setStep(1);
    });

  const upload = (kind) => (file) =>
    run(async () => {
      const dataBase64 = await toB64(file);
      await api('/guest-portal/checkin/sessions/' + session.id + '/upload', {
        method: 'POST',
        body: { kind, dataBase64 },
      });
      if (kind === 'selfie') setStep(2);
      toast({ title: kind === 'id' ? 'ID uploaded' : 'Selfie uploaded' });
    });

  const saveDocs = () =>
    run(async () => {
      await api('/guest-portal/checkin/sessions/' + session.id + '/documents', {
        method: 'POST',
        body: docs,
      });
      setStep(3);
    });

  const saveSignature = (dataBase64) =>
    run(async () => {
      await api('/guest-portal/checkin/sessions/' + session.id + '/signature', {
        method: 'POST',
        body: { dataBase64 },
      });
      const card = await api('/guest-portal/checkin/sessions/' + session.id + '/registration-card');
      setCardUrl(card.url);
      setStep(4);
    });

  const payDeposit = () =>
    run(async () => {
      const d = await api('/guest-portal/checkin/sessions/' + session.id + '/deposit', {
        method: 'POST',
        body: {},
      });
      setDeposit(d);
    });

  const simulatePaid = () =>
    run(async () => {
      await api('/guest-portal/checkin/deposit/confirm', {
        method: 'POST',
        body: { reference: deposit.reference },
      });
      setDeposit((d) => ({ ...d, paid: true }));
    });

  const complete = () =>
    run(async () => {
      await api('/guest-portal/checkin/sessions/' + session.id + '/complete', { method: 'POST' });
      const k = await api('/guest-portal/checkin/sessions/' + session.id + '/key-status');
      setKey(k);
      setStep(5);
    });

  useEffect(() => {
    if (step === 5) refresh();
  }, [step]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Online check-in</h1>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            session?.status === 'completed' || session?.status === 'approved'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          )}
        >
          {session ? session.status.replace(/_/g, ' ') : 'not started'}
        </span>
      </div>
      <StepIndicator steps={STEPS} currentStep={step} />
      {error && <ErrorState title={error} onRetry={() => setError(null)} />}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Find your reservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-text-secondary">
              Enter your confirmation number. Check-in opens 14 days before arrival.
            </p>
            <Input
              placeholder="e.g. DEMO-4204"
              value={conf}
              onChange={(e) => setConf(e.target.value)}
            />
            <Button onClick={start} disabled={busy || conf.trim().length < 3} className="w-full">
              Start check-in <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && session && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-5 w-5 text-secondary" /> ID & selfie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUploadZone label="Upload ID document" accept="image/*" onUpload={upload('id')} />
            <FileUploadZone label="Upload a selfie" accept="image/*" onUpload={upload('selfie')} />
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && session && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck2 className="h-5 w-5 text-secondary" /> Document details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">ID type</Label>
              <Select
                value={docs.idDocType}
                onValueChange={(v) => setDocs({ ...docs, idDocType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="drivers_license">Driver's license</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ID number</Label>
              <Input
                value={docs.idDocNumber}
                onChange={(e) => setDocs({ ...docs, idDocNumber: e.target.value })}
                placeholder="As printed on the document"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button onClick={saveDocs} disabled={busy || docs.idDocNumber.trim().length < 2}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && session && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PenLine className="h-5 w-5 text-secondary" /> Sign the registration card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignaturePad onSave={saveSignature} disabled={busy} />
          </CardContent>
        </Card>
      )}

      {step === 4 && session && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-secondary" /> Review & deposit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cardUrl && (
              <Button variant="outline" onClick={() => window.open(cardUrl, '_blank')}>
                <Download className="mr-1 h-4 w-4" /> Download registration card (PDF)
              </Button>
            )}
            {!deposit && (
              <div className="space-y-2">
                <p className="text-sm text-text-secondary">
                  A refundable deposit secures your online check-in.
                </p>
                <Button onClick={payDeposit} disabled={busy}>
                  Create deposit payment link
                </Button>
              </div>
            )}
            {deposit && !deposit.paid && (
              <div className="space-y-2 rounded border border-border p-3 text-sm">
                <p className="text-text-primary">
                  Pay via the hosted link, then confirm here (demo simulates the Paystack callback):
                </p>
                <a
                  className="block break-all text-secondary underline"
                  href={deposit.hostedUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {deposit.hostedUrl}
                </a>
                <Button size="sm" variant="secondary" onClick={simulatePaid} disabled={busy}>
                  I've paid — confirm deposit
                </Button>
              </div>
            )}
            {deposit?.paid && (
              <p className="text-sm font-medium text-emerald-600">Deposit settled.</p>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button onClick={complete} disabled={busy || (deposit && !deposit.paid)}>
                Complete check-in <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PartyPopper className="h-5 w-5 text-emerald-500" /> You're checked in online
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-text-secondary">
              The front desk has your registration card and documents. Your key activates once the
              desk approves the final step.
            </p>
            {key?.eligible ? (
              <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
                <KeyRound className="h-5 w-5" /> Digital key active:{' '}
                <span className="font-mono font-bold">{key.key}</span>
              </div>
            ) : (
              <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                Waiting for front-desk approval — pull to refresh.
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={refresh} disabled={busy}>
                Refresh key status
              </Button>
              <Button variant="ghost" onClick={() => navigate('/guest-portal/timeline')}>
                View my timeline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SignaturePad({ onSave, disabled }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const start = (e) => {
    drawing.current = true;
    const c = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    c.beginPath();
    c.moveTo(x, y);
    e.preventDefault();
  };
  const move = (e) => {
    if (!drawing.current) return;
    const c = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    c.lineTo(x, y);
    c.stroke();
    setDirty(true);
    e.preventDefault();
  };
  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
  };

  const save = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(String(dataUrl).split(',')[1]);
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={520}
        height={180}
        className="w-full touch-none rounded border border-border bg-white"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear
        </Button>
        <Button size="sm" onClick={save} disabled={!dirty || disabled}>
          Save signature
        </Button>
      </div>
    </div>
  );
}
