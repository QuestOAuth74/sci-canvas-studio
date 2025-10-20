import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, Mail, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  country: string | null;
}

const EmailNotifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [adminName, setAdminName] = useState("BioSketch Team");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, country')
        .not('email', 'is', null)
        .order('full_name');
      
      if (error) throw error;
      return data as Profile[];
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          recipientIds: sendToAll ? "all" : selectedUsers,
          subject,
          message,
          adminName,
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Emails sent successfully!",
          description: `Sent to ${data.sent} recipient(s)${data.failed > 0 ? `. Failed: ${data.failed}` : ''}`,
        });
        setSubject("");
        setMessage("");
        setSelectedUsers([]);
        setSendToAll(false);
      } else {
        toast({
          title: "Failed to send emails",
          description: data.error || data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error sending emails",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (!users) return;
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSend = () => {
    if (!subject.trim()) {
      toast({
        title: "Subject required",
        description: "Please enter an email subject",
        variant: "destructive",
      });
      return;
    }
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter an email message",
        variant: "destructive",
      });
      return;
    }
    if (!sendToAll && selectedUsers.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one recipient or choose 'Send to All'",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate();
  };

  const recipientCount = sendToAll ? users?.length || 0 : selectedUsers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="neo-brutalist-shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-4xl font-black uppercase">Email Notifications</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipients Selection */}
          <Card className="neo-brutalist-shadow lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients
              </CardTitle>
              <CardDescription>
                Select users to send emails to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendToAll"
                    checked={sendToAll}
                    onCheckedChange={(checked) => setSendToAll(checked as boolean)}
                  />
                  <Label htmlFor="sendToAll" className="cursor-pointer font-bold">
                    Send to All Users ({users?.length || 0})
                  </Label>
                </div>

                <Separator />

                {!sendToAll && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="w-full"
                    >
                      {selectedUsers.length === users?.length ? 'Deselect All' : 'Select All'}
                    </Button>

                    <ScrollArea className="h-[400px] pr-4">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {users?.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50"
                            >
                              <Checkbox
                                id={user.id}
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() => handleToggleUser(user.id)}
                              />
                              <Label
                                htmlFor={user.id}
                                className="cursor-pointer flex-1"
                              >
                                <div className="font-medium">{user.full_name || 'No name'}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Composition */}
          <Card className="neo-brutalist-shadow lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compose Email
              </CardTitle>
              <CardDescription>
                Send notifications to selected users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Your Name</Label>
                  <Input
                    id="adminName"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="BioSketch Team"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Important update from BioSketch"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {subject.length} / 200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={12}
                    maxLength={10000}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length} / 10,000 characters
                  </p>
                </div>

                <Separator />

                <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-medium">
                    Ready to send to <span className="font-bold text-primary">{recipientCount}</span> recipient{recipientCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={sendEmailMutation.isPending}
                  className="w-full neo-brutalist-shadow-sm"
                  size="lg"
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailNotifications;
