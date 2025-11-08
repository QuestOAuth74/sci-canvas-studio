import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const ToolRatingWidget = () => {
  const [showWidget, setShowWidget] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedRating, setSelectedRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Check if user has already rated or dismissed
    const hasRated = localStorage.getItem('biosketch_tool_rating_submitted');
    const hasDismissed = localStorage.getItem('biosketch_tool_rating_dismissed');
    
    if (hasRated || hasDismissed) {
      setIsVisible(false);
      return;
    }

    // Show widget after 30 seconds
    const timer = setTimeout(() => {
      setShowWidget(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleRatingSelect = (rating: 'thumbs_up' | 'thumbs_down') => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (!selectedRating) return;

    try {
      // Get or create session ID
      let sessionId = sessionStorage.getItem('biosketch_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('biosketch_session_id', sessionId);
      }

      const { error } = await supabase
        .from('tool_feedback')
        .insert({
          user_id: user?.id || null,
          rating: selectedRating,
          page: 'canvas',
          user_agent: navigator.userAgent,
          session_id: sessionId,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      // Mark as submitted
      setIsSubmitted(true);
      localStorage.setItem('biosketch_tool_rating_submitted', 'true');

      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve.",
      });

      // Fade out after 2 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('biosketch_tool_rating_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !showWidget) return null;

  return (
    <Card className="fixed bottom-20 right-6 w-80 p-4 backdrop-blur-md bg-background/95 border-border shadow-lg z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      {!isSubmitted ? (
        <div className="space-y-4">
          <div className="pr-6">
            <h3 className="font-semibold text-foreground">
              Do you like this design tool?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your feedback helps us improve
            </p>
          </div>

          {!selectedRating ? (
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                onClick={() => handleRatingSelect('thumbs_up')}
              >
                <ThumbsUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 border-2 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                onClick={() => handleRatingSelect('thumbs_down')}
              >
                <ThumbsDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 justify-center pb-2">
                {selectedRating === 'thumbs_up' ? (
                  <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {selectedRating === 'thumbs_up' ? 'Glad you like it!' : 'Thanks for letting us know'}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback-comment" className="text-sm text-foreground">
                  Any additional comments? (optional)
                </Label>
                <Textarea
                  id="feedback-comment"
                  placeholder="Tell us more about your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {comment.length}/500
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedRating(null)}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSubmit}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-2 animate-in fade-in duration-300">
          <h3 className="font-semibold text-foreground">
            Thanks for your feedback! 🎉
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            We appreciate your input
          </p>
        </div>
      )}
    </Card>
  );
};
