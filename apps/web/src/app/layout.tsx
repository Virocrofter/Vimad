import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../components/theme-provider';
import { OfflineBanner } from '../components/OfflineBanner';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <OfflineBanner />
      <Outlet />
    </ThemeProvider>
  );
}
