import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Heart, Users, MessageSquare, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'project' | 'like' | 'collaboration' | 'comment' | 'mention';
  title: string;
  timestamp: string;
}

interface ActivityTimelineProps {
  activities?: Activity[];
}

const activityIcons = {
  project: FileText,
  like: Heart,
  collaboration: Users,
  comment: MessageSquare,
  mention: AtSign,
};

const activityColors = {
  project: 'from-blue-500 to-blue-600',
  like: 'from-pink-500 to-pink-600',
  collaboration: 'from-purple-500 to-purple-600',
  comment: 'from-green-500 to-green-600',
  mention: 'from-orange-500 to-orange-600',
};

export function ActivityTimeline({ activities = [] }: ActivityTimelineProps) {
  // Mock activities if none provided
  const displayActivities = activities.length > 0 ? activities : [
    { id: '1', type: 'project' as const, title: 'Created new project', timestamp: new Date().toISOString() },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-body-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 px-6 pb-6">
            {displayActivities.map((activity, index) => {
              const Icon = activityIcons[activity.type];
              const gradient = activityColors[activity.type];
              
              return (
                <div key={activity.id} className="relative">
                  {index < displayActivities.length - 1 && (
                    <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
                  )}
                  
                  <div className="flex items-start gap-3 py-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-ui-caption text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
