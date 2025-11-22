import { ReactNode } from 'react';
import { TopNavBar } from './TopNavBar';
import { MaintenanceBanner } from './MaintenanceBanner';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen">
      <MaintenanceBanner />
      <TopNavBar />
      <main>
        {children}
      </main>
    </div>
  );
};
