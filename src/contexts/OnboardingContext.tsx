import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string; // Optional action prompt for the user
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BioSketch!',
    description: 'Let\'s take a quick tour of the essential features to get you started with creating scientific figures.',
    target: '#canvas-container',
    position: 'bottom'
  },
  {
    id: 'shapes',
    title: 'Add Shapes',
    description: 'Click here to add basic shapes like rectangles, circles, and more to your canvas.',
    target: '[data-onboarding="shapes-dropdown"]',
    position: 'bottom'
  },
  {
    id: 'icons',
    title: 'Browse Icons',
    description: 'Access our library of scientific icons and symbols to enhance your diagrams.',
    target: '[data-onboarding="icon-library"]',
    position: 'right'
  },
  {
    id: 'connectors',
    title: 'Create Connections',
    description: 'Use connector tools to draw arrows and lines between elements.',
    target: '[data-onboarding="connector-tool"]',
    position: 'bottom'
  },
  {
    id: 'export',
    title: 'Export Your Work',
    description: 'When you\'re done, export your figure in various formats including PNG, SVG, and PDF.',
    target: '[data-onboarding="export-button"]',
    position: 'bottom'
  }
];

const ONBOARDING_STORAGE_KEY = 'biosketch-onboarding-completed';

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: OnboardingStep | null;
  totalSteps: number;
  isCompleted: boolean;
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Check if user has completed onboarding on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (completed === 'true') {
      setIsCompleted(true);
    } else {
      // Start onboarding automatically for new users
      setIsActive(true);
    }
  }, []);

  const startOnboarding = () => {
    setCurrentStepIndex(0);
    setIsActive(true);
    setIsCompleted(false);
  };

  const nextStep = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsCompleted(false);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const currentStep = isActive ? ONBOARDING_STEPS[currentStepIndex] : null;

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        totalSteps: ONBOARDING_STEPS.length,
        isCompleted,
        startOnboarding,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
