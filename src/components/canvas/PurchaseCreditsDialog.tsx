import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Sparkles, Check, Loader2, CreditCard, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreditPackage {
  id: string;
  priceId: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
  savings?: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    priceId: 'price_1SlN0vKH9LDdYZKLFynLFMLV',
    name: 'Starter Pack',
    credits: 1800,
    price: 11,
    pricePerCredit: 11 / 1800,
  },
  {
    id: 'pro',
    priceId: 'price_1SlN19KH9LDdYZKLWoXy0hP7',
    name: 'Pro Pack',
    credits: 6000,
    price: 30,
    pricePerCredit: 30 / 6000,
    popular: true,
    savings: 'Save 18%',
  },
  {
    id: 'ultimate',
    priceId: 'price_1SlN1WKH9LDdYZKL0gRj2bXz',
    name: 'Ultimate Pack',
    credits: 15000,
    price: 65,
    pricePerCredit: 65 / 15000,
    savings: 'Save 29%',
  },
];

interface PurchaseCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseCreditsDialog({ open, onOpenChange }: PurchaseCreditsDialogProps) {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>('pro');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { priceId: pkg.priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: 'Redirecting to checkout',
          description: 'Complete your purchase in the new tab.',
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="h-5 w-5 text-primary" />
            Purchase AI Credits
          </DialogTitle>
          <DialogDescription>
            Get more AI generations for your scientific figures. Credits never expire.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={cn(
                'cursor-pointer transition-all relative',
                selectedPackage === pkg.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'hover:border-primary/50',
                pkg.popular && 'border-primary'
              )}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {pkg.name}
                  {selectedPackage === pkg.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </CardTitle>
                {pkg.savings && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {pkg.savings}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${pkg.price}</span>
                  <span className="text-muted-foreground text-sm">USD</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">{pkg.credits.toLocaleString()} credits</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ${(pkg.pricePerCredit * 100).toFixed(2)} per 100 credits
                </p>
                <p className="text-xs text-muted-foreground">
                  ≈ {Math.floor(pkg.credits / 100)} AI generations
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handlePurchase}
            disabled={isPurchasing}
            size="lg"
            className="w-full"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase with Stripe
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe. Credits are added instantly after purchase.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
