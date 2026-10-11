/* apps/web/src/components/layout/Topbar.tsx */
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-4 pl-10 lg:pl-0">
        <h2 className="text-lg font-semibold text-text-primary">Command Center</h2>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">
                {user.firstName ?? ''} {user.lastName ?? ''}
              </p>
              <p className="text-xs capitalize text-text-muted">{user.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
