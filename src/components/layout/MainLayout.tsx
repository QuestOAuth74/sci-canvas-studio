import { ReactNode } from 'react';
import { TopNavBar } from './TopNavBar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen notebook-page">
      <TopNavBar />
      <main>
        {children}
      </main>
    </div>
  );
};
