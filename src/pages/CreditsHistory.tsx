import React from 'react';
import { useCreditsHistory, CreditTransaction } from '@/hooks/useCreditsHistory';
import { useAICredits } from '@/hooks/useAICredits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Coins, 
  Sparkles, 
  ShoppingCart, 
  ArrowDownCircle, 
  ArrowUpCircle,
  RefreshCw,
  History,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { PurchaseCreditsDialog } from '@/components/canvas/PurchaseCreditsDialog';

export default function CreditsHistory() {
  const { transactions, isLoading, refetch } = useCreditsHistory(100);
  const { creditsInfo, isLoading: creditsLoading } = useAICredits();
  const [purchaseOpen, setPurchaseOpen] = React.useState(false);

  // Calculate stats
  const totalSpent = transactions
    .filter(t => t.type === 'generation')
    .reduce((sum, t) => sum + Math.abs(t.creditsChange), 0);
  
  const totalPurchased = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.creditsChange, 0);

  const generationsCount = transactions.filter(t => t.type === 'generation').length;
  const purchasesCount = transactions.filter(t => t.type === 'purchase').length;

  const getTransactionIcon = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'generation':
        return <ArrowDownCircle className="h-4 w-4 text-destructive" />;
      case 'purchase':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getTransactionBadge = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'generation':
        return <Badge variant="outline" className="text-destructive border-destructive/30">Usage</Badge>;
      case 'purchase':
        return <Badge variant="outline" className="text-green-600 border-green-500/30">Purchase</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Credits History
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your AI generations and credit transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setPurchaseOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Credits
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              Current Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-primary">
                {creditsInfo?.remainingCredits.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Generations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generationsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Credits Used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Credits Purchased
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalPurchased.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <CardDescription>
            {transactions.length} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Your AI generations and purchases will appear here</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {getTransactionIcon(transaction.type)}
                      </TableCell>
                      <TableCell>
                        {getTransactionBadge(transaction.type)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="truncate block" title={transaction.description}>
                          {transaction.description}
                        </span>
                        {transaction.metadata?.style && (
                          <span className="text-xs text-muted-foreground">
                            Style: {transaction.metadata.style}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={transaction.creditsChange > 0 ? 'text-green-600' : 'text-destructive'}>
                          {transaction.creditsChange > 0 ? '+' : ''}{transaction.creditsChange.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        <div>{format(new Date(transaction.createdAt), 'MMM d, yyyy')}</div>
                        <div className="text-xs">
                          {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <PurchaseCreditsDialog open={purchaseOpen} onOpenChange={setPurchaseOpen} />
    </div>
  );
}
