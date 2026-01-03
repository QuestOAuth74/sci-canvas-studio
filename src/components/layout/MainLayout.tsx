import { ReactNode } from 'react';
import { TopNavBar } from './TopNavBar';
import { StackedCircularFooter } from '@/components/ui/stacked-circular-footer';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen notebook-page flex flex-col">
      <TopNavBar />
      <main className="flex-1">
        {children}
      </main>
      <StackedCircularFooter />
    </div>
  );
};
