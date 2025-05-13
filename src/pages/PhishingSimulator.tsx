
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Loader2, Mail } from "lucide-react";
import { mockSendPhishingCampaign } from "@/lib/supabase";
import { toast } from "sonner";
import { Bar, BarChart as ReBarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const emailFormSchema = z.object({
  campaignName: z.string().min(3, { message: "Campaign name is required (min 3 characters)" }),
  emailSubject: z.string().min(1, { message: "Email subject is required" }),
  template: z.string().min(1, { message: "Template is required" }),
  targetEmails: z.string()
    .min(5, { message: "Target emails are required" })
    .refine((emails) => {
      const emailArray = emails.split('\n').map(e => e.trim()).filter(Boolean);
      return emailArray.every((email) => 
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      );
    }, { message: "Enter valid email addresses (one per line)" }),
});

const mockCampaigns = [
  {
    id: 'camp_123',
    name: 'Security Training - Q1',
    sent: 45,
    clicked: 12,
    date: '2023-02-15T12:00:00Z',
    clickRate: 26.7,
  },
  {
    id: 'camp_456',
    name: 'Password Reset',
    sent: 32,
    clicked: 18,
    date: '2023-03-22T10:30:00Z',
    clickRate: 56.3,
  },
];

const mockTemplates = [
  {
    id: 'tmpl_1',
    name: 'Password Reset',
    content: `Dear [User],

We detected unusual activity on your account. To secure your account, please reset your password immediately by clicking the link below:

[RESET PASSWORD]

If you did not request this change, please contact our support team immediately.

Regards,
IT Security Team`,
  },
  {
    id: 'tmpl_2',
    name: 'DocuSign Document',
    content: `Hello [User],

You have received a document to sign through DocuSign.

Document: [Company] Contract Renewal
Sender: admin@company.com

[VIEW DOCUMENT]

This document requires your signature by the end of the week.

Best regards,
DocuSign Team`,
  },
  {
    id: 'tmpl_3',
    name: 'IT System Update',
    content: `Important: System Update Required

Dear [User],

Our IT department is performing critical security updates. Please verify your account to avoid service interruption:

[VERIFY ACCOUNT]

This process will only take 2 minutes.

Thank you,
IT Department`,
  },
];

const chartData = [
  { name: 'Security Training - Q1', clickRate: 26.7 },
  { name: 'Password Reset', clickRate: 56.3 },
  { name: 'IT System Update', clickRate: 38.2 },
];

const PhishingSimulator = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [selectedTemplate, setSelectedTemplate] = useState('tmpl_1');

  const form = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      campaignName: '',
      emailSubject: '',
      template: mockTemplates[0].content,
      targetEmails: '',
    },
  });

  // Update template when selection changes
  const updateTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = mockTemplates.find(t => t.id === templateId);
    if (template) {
      form.setValue('template', template.content);
    }
  };

  const onSubmit = async (values: z.infer<typeof emailFormSchema>) => {
    setIsSubmitting(true);

    const targetEmailsArray = values.targetEmails
      .split('\n')
      .map(e => e.trim())
      .filter(Boolean);

    const campaign = {
      name: values.campaignName,
      subject: values.emailSubject,
      template: values.template,
      targets: targetEmailsArray,
    };

    try {
      await mockSendPhishingCampaign(campaign);
      toast.success("Phishing campaign scheduled successfully");
      form.reset();
      setActiveTab('reports');
    } catch (error) {
      console.error("Campaign error:", error);
      toast.error("Failed to schedule campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-cyber-blue font-mono">Phishing Simulator</h1>
        <p className="text-cyber-gray mt-2">
          Create and track phishing awareness campaigns
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="reports">Campaign Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-xl font-mono">New Phishing Campaign</CardTitle>
              <CardDescription>
                Configure and send a phishing awareness campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="campaignName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Q2 Security Training"
                            className="cyber-input"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailSubject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Urgent: Password Reset Required"
                            className="cyber-input"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Email Template</FormLabel>
                    <Select 
                      value={selectedTemplate} 
                      onValueChange={updateTemplate}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="cyber-input">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Content</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={10}
                            className="cyber-input font-mono text-sm"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Customize your phishing email content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Emails</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="user1@company.com&#10;user2@company.com&#10;user3@company.com"
                            rows={4}
                            className="cyber-input font-mono text-sm"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter target email addresses (one per line)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full cyber-btn" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling Campaign...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Launch Campaign
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card className="cyber-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-mono">Campaign Performance</CardTitle>
              <CardDescription>
                Overview of click rates across campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#8892B0" 
                    fontSize={12} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#8892B0" 
                    fontSize={12}
                    tickLine={false}
                    unit="%" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0A192F', 
                      borderColor: '#64FFDA',
                      fontSize: 12,
                      fontFamily: 'monospace'
                    }} 
                  />
                  <Bar 
                    dataKey="clickRate" 
                    fill="#64FFDA" 
                    name="Click Rate" 
                    unit="%" 
                  />
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid gap-4">
            {mockCampaigns.map(campaign => (
              <Card key={campaign.id} className="cyber-card">
                <CardHeader>
                  <CardTitle>{campaign.name}</CardTitle>
                  <CardDescription>
                    Sent: {new Date(campaign.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-cyber-gray text-sm">Emails Sent</p>
                      <p className="text-xl font-mono text-cyber-lightgray">{campaign.sent}</p>
                    </div>
                    <div>
                      <p className="text-cyber-gray text-sm">Clicks</p>
                      <p className="text-xl font-mono text-cyber-lightgray">{campaign.clicked}</p>
                    </div>
                    <div>
                      <p className="text-cyber-gray text-sm">Click Rate</p>
                      <p className={`text-xl font-mono ${campaign.clickRate > 30 ? 'text-red-400' : 'text-green-400'}`}>
                        {campaign.clickRate}%
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <BarChart className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhishingSimulator;
