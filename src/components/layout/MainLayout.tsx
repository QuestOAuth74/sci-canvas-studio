import { ReactNode } from 'react';
import { TopNavBar } from './TopNavBar';
import { AppFooter } from './AppFooter';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavBar />
      <main className="flex-1">
        {children}
      </main>
      <AppFooter />
    </div>
  );
};
