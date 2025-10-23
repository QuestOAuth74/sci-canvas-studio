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
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 20;

  // Fetch users with pagination and search
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users', currentPage, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, country', { count: 'exact' })
        .not('email', 'is', null)
        .order('full_name');
      
      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      return { 
        users: data as Profile[], 
        totalCount: count || 0 
      };
    }
  });

  const users = usersData?.users || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const showingFrom = totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

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
    if (users.length === 0) return;
    const visibleUserIds = users.map(u => u.id);
    
    // Check if all visible users are selected
    const allVisibleSelected = visibleUserIds.every(id => selectedUsers.includes(id));
    
    if (allVisibleSelected) {
      // Deselect all visible users
      setSelectedUsers(prev => prev.filter(id => !visibleUserIds.includes(id)));
    } else {
      // Select all visible users (add to existing selections)
      setSelectedUsers(prev => [...new Set([...prev, ...visibleUserIds])]);
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

  const recipientCount = sendToAll ? totalCount : selectedUsers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-4xl font-bold">Email Notifications</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipients Selection */}
          <Card className="lg:col-span-1">
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
                    onCheckedChange={(checked) => {
                      setSendToAll(checked as boolean);
                      if (checked) {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                  <Label htmlFor="sendToAll" className="cursor-pointer font-bold">
                    Send to All Users ({totalCount})
                  </Label>
                </div>

                <Separator />

                {!sendToAll && (
                  <>
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Showing {showingFrom} - {showingTo} of {totalCount} users
                      {selectedUsers.length > 0 && ` • ${selectedUsers.length} selected`}
                    </p>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="w-full"
                    >
                      {users.length > 0 && users.every(u => selectedUsers.includes(u.id)) 
                        ? 'Deselect Page' 
                        : 'Select Page'}
                    </Button>

                    <ScrollArea className="h-[400px] pr-4">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : users.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No users found
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {users.map((user) => (
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
                                {user.country && (
                                  <div className="text-xs text-muted-foreground">{user.country}</div>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    
                    {totalPages > 1 && (
                      <Pagination className="mt-4">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalPages)].map((_, idx) => {
                            const pageNum = idx + 1;
                            if (
                              pageNum === 1 || 
                              pageNum === totalPages || 
                              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(pageNum)}
                                    isActive={currentPage === pageNum}
                                    className="cursor-pointer"
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                              return <PaginationEllipsis key={pageNum} />;
                            }
                            return null;
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Composition */}
          <Card className="lg:col-span-2">
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
                  className="w-full"
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
