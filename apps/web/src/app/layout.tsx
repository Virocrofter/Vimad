import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../components/theme-provider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}
