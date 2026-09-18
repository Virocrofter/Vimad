import { useState } from 'react';
import { RegisterWizard } from '../../../components/auth/RegisterWizard';
import { RotateCcw, Clock } from 'lucide-react';

const STORAGE_KEY = 'pms-onboarding-progress';

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.savedAt) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export default function OnboardingPage() {
  const [savedProgress, setSavedProgress] = useState(loadSavedProgress);

  const handleResume = () => {
    // The RegisterWizard auto-loads on mount, so just clear the banner
    setSavedProgress(null);
  };

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedProgress(null);
    window.location.reload();
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return 'earlier';
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Property Setup</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure your property to get started with Unified PMS.
        </p>
      </div>

      {/* Resume banner */}
      {savedProgress && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                <Clock className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">You have a saved session</p>
                <p className="text-xs text-text-muted">
                  Last worked on {formatTime(savedProgress.savedAt)} · Step {savedProgress.step + 1}{' '}
                  of 5
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResume}
                className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-white hover:bg-secondary/90 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={handleRestart}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restart
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <RegisterWizard />
      </div>
    </div>
  );
}
