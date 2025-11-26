import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Send } from "lucide-react";

export const AnnouncementManager = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("BioSketch Team");
  const [targetAudience, setTargetAudience] = useState<"all" | "premium" | "new">("all");
  const [isSending, setIsSending] = useState(false);

  const handleSendAnnouncement = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-announcement", {
        body: {
          subject: subject.trim(),
          message: message.trim(),
          senderName: senderName.trim(),
          targetAudience,
        },
      });

      if (error) throw error;

      toast.success(`Announcement sent to ${data.count} users`);
      setSubject("");
      setMessage("");
      setTargetAudience("all");
    } catch (error: any) {
      console.error("Error sending announcement:", error);
      toast.error(error.message || "Failed to send announcement");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <CardTitle>Send Announcement</CardTitle>
        </div>
        <CardDescription>
          Send in-app notifications to users. Messages appear in their notification bell.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sender">Sender Name</Label>
          <Input
            id="sender"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="BioSketch Team"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="New Feature: Real-time Collaboration"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We're excited to announce real-time collaboration features..."
            rows={5}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/500
          </p>
        </div>

        <div className="space-y-2">
          <Label>Target Audience</Label>
          <RadioGroup value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="font-normal cursor-pointer">
                All users
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="premium" id="premium" />
              <Label htmlFor="premium" className="font-normal cursor-pointer">
                Premium users (3+ approved projects)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="font-normal cursor-pointer">
                New users (joined in last 7 days)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleSendAnnouncement}
          disabled={isSending || !subject.trim() || !message.trim()}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? "Sending..." : "Send Announcement"}
        </Button>
      </CardContent>
    </Card>
  );
};
