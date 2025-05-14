import { useState, useEffect } from "react";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Download, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { PhishingCampaign, PhishingRecipient, getPhishingCampaignDetails } from "@/lib/phishing";

interface CampaignDetailsProps {
  campaignId: string;
  onBack: () => void;
}

const CampaignDetails = ({ campaignId, onBack }: CampaignDetailsProps) => {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<PhishingCampaign | null>(null);
  const [recipients, setRecipients] = useState<PhishingRecipient[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const { campaign, recipients } = await getPhishingCampaignDetails(campaignId);
      setCampaign(campaign);
      setRecipients(recipients);
      setLoading(false);
    };

    fetchDetails();
  }, [campaignId]);

  const downloadReport = () => {
    if (!campaign || !recipients.length) return;
    
    const headers = ["Email", "Clicked", "Clicked At"];
    
    const csvData = [
      headers,
      ...recipients.map(recipient => [
        recipient.email,
        recipient.clicked ? "Yes" : "No",
        recipient.clicked_at ? format(new Date(recipient.clicked_at), "yyyy-MM-dd HH:mm:ss") : "-"
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `campaign_report_${campaign.title}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className="cyber-card">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyber-blue border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!campaign) {
    return (
      <Card className="cyber-card">
        <CardContent className="pt-6">
          <p className="text-center text-cyber-red">Campaign not found</p>
          <Button onClick={onBack} className="mt-4 mx-auto block">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        <Button onClick={downloadReport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-xl font-mono">{campaign.title}</CardTitle>
          <CardDescription>
            Created {format(new Date(campaign.created_at), "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-cyber-gray text-sm">Emails Sent</p>
              <p className="text-xl font-mono text-cyber-lightgray">{campaign.total_sent || 0}</p>
            </div>
            <div>
              <p className="text-cyber-gray text-sm">Clicked</p>
              <p className="text-xl font-mono text-cyber-lightgray">{campaign.clicked_count || 0}</p>
            </div>
            <div>
              <p className="text-cyber-gray text-sm">Click Rate</p>
              <p className={`text-xl font-mono ${(campaign.click_rate || 0) > 30 ? 'text-red-400' : 'text-green-400'}`}>
                {campaign.click_rate?.toFixed(1) || '0.0'}%
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Email Details</h3>
            <div className="space-y-2">
              <p><strong>Subject:</strong> {campaign.subject}</p>
              <div>
                <strong>Body:</strong>
                <div className="mt-2 p-3 bg-gray-900 rounded-md overflow-auto max-h-32">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-300">{campaign.body}</pre>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-lg font-mono">Recipients</CardTitle>
          <CardDescription>
            {recipients.length} total recipients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clicked At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell className="font-mono">{recipient.email}</TableCell>
                  <TableCell>
                    {recipient.clicked ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Clicked</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                        <span>Not clicked</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {recipient.clicked_at 
                      ? format(new Date(recipient.clicked_at), "yyyy-MM-dd HH:mm:ss")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignDetails;
