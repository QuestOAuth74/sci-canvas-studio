import { cn } from '@/lib/utils';
import { MessageCircle, CheckCircle } from 'lucide-react';

interface CommentPinProps {
  x: number;
  y: number;
  isResolved?: boolean;
  isSelected?: boolean;
  replyCount?: number;
  onClick?: () => void;
}

export function CommentPin({
  x,
  y,
  isResolved = false,
  isSelected = false,
  replyCount = 0,
  onClick,
}: CommentPinProps) {
  return (
    <button
      className={cn(
        'absolute flex items-center justify-center transition-all duration-150',
        'w-8 h-8 -translate-x-1/2 -translate-y-full',
        'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected && 'scale-110 z-10'
      )}
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      {/* Pin body */}
      <div
        className={cn(
          'relative flex items-center justify-center w-7 h-7 rounded-full shadow-lg',
          'border-2 transition-colors',
          isResolved
            ? 'bg-green-500 border-green-600'
            : isSelected
            ? 'bg-primary border-primary'
            : 'bg-yellow-500 border-yellow-600 hover:bg-yellow-400'
        )}
      >
        {isResolved ? (
          <CheckCircle className="w-4 h-4 text-white" />
        ) : (
          <MessageCircle className="w-4 h-4 text-white" />
        )}

        {/* Reply count badge */}
        {replyCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full',
              'bg-background text-foreground border shadow-sm'
            )}
          >
            {replyCount}
          </span>
        )}
      </div>

      {/* Pin point */}
      <div
        className={cn(
          'absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[2px]',
          'w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px]',
          'border-l-transparent border-r-transparent',
          isResolved
            ? 'border-t-green-600'
            : isSelected
            ? 'border-t-primary'
            : 'border-t-yellow-600'
        )}
      />
    </button>
  );
}
