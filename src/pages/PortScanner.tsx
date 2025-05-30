
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wifi, WifiOff, Shield } from "lucide-react";
import { realTimePortScanner, PortScanResult } from "@/services/realTimePortScanner";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  target: z.string().min(1, { message: "Target is required" })
    .refine(value => /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$|^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(value), {
      message: "Enter a valid domain or IP address",
    }),
});

const commonPorts = [
  { id: 21, label: "21 (FTP)" },
  { id: 22, label: "22 (SSH)" },
  { id: 23, label: "23 (Telnet)" },
  { id: 25, label: "25 (SMTP)" },
  { id: 53, label: "53 (DNS)" },
  { id: 80, label: "80 (HTTP)" },
  { id: 443, label: "443 (HTTPS)" },
  { id: 3306, label: "3306 (MySQL)" },
  { id: 3389, label: "3389 (RDP)" },
  { id: 5432, label: "5432 (PostgreSQL)" },
];

const PortScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<PortScanResult | null>(null);
  const [scanOutput, setScanOutput] = useState<string[]>([]);
  const [selectedPorts, setSelectedPorts] = useState<number[]>([22, 80, 443]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const terminalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target: "",
    },
  });

  useEffect(() => {
    const handlePortScanOutput = (event: CustomEvent) => {
      const line = event.detail;
      setScanOutput(prev => [...prev, line]);
    };

    const handlePortScanComplete = (event: CustomEvent) => {
      const result = event.detail as PortScanResult;
      setScanResults(result);
      setIsScanning(false);
      setConnectionStatus('disconnected');
      
      const openCount = result.results.filter(r => r.status === 'open').length;
      
      toast({
        title: "Real-Time Port Scan Completed",
        description: `Found ${openCount} open ports with Shodan intelligence`,
        variant: openCount > 0 ? "default" : "secondary",
      });
    };

    window.addEventListener('portScanOutput', handlePortScanOutput as EventListener);
    window.addEventListener('portScanComplete', handlePortScanComplete as EventListener);
    
    return () => {
      window.removeEventListener('portScanOutput', handlePortScanOutput as EventListener);
      window.removeEventListener('portScanComplete', handlePortScanComplete as EventListener);
    };
  }, [toast]);

  useEffect(() => {
    // Auto-scroll terminal to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [scanOutput]);

  const togglePort = (portId: number) => {
    setSelectedPorts(current => 
      current.includes(portId)
        ? current.filter(id => id !== portId)
        : [...current, portId]
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (selectedPorts.length === 0) {
      form.setError("target", { 
        type: "manual", 
        message: "Select at least one port to scan" 
      });
      return;
    }
    
    setIsScanning(true);
    setScanResults(null);
    setScanOutput([]);
    setConnectionStatus('connecting');
    
    try {
      await realTimePortScanner.startPortScan(values.target, selectedPorts);
      setConnectionStatus('connected');
      
      toast({
        title: "Real-Time Port Scan Started",
        description: `Scanning ${selectedPorts.length} ports with Shodan intelligence`,
      });
    } catch (error) {
      console.error("Port scan error:", error);
      setIsScanning(false);
      setConnectionStatus('disconnected');
      toast({
        title: "Scan Failed to Start",
        description: "Unable to initiate port scan. Check network connection.",
        variant: "destructive",
      });
    }
  };

  const stopScan = () => {
    realTimePortScanner.stopScan();
    setIsScanning(false);
    setConnectionStatus('disconnected');
    toast({
      title: "Scan Stopped",
      description: "Real-time port scan has been terminated",
    });
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-cyber-blue font-mono">
          Real-Time Port Scanner
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-cyber-gray">
            Advanced port scanning with Shodan intelligence and real-time results
          </p>
          <div className="flex items-center gap-1">
            {getConnectionIcon()}
            <span className="text-xs text-cyber-gray capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-xl font-mono flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Real-Time Scan Configuration
            </CardTitle>
            <CardDescription>
              Enter target and select ports for live scanning with Shodan data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example.com or 192.168.1.1"
                          className="cyber-input"
                          {...field}
                          disabled={isScanning}
                        />
                      </FormControl>
                      <FormDescription>
                        Domain name or IP address for real-time port scanning
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Ports to Scan (with Shodan Intelligence)</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {commonPorts.map((port) => (
                      <div key={port.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`port-${port.id}`}
                          checked={selectedPorts.includes(port.id)}
                          onCheckedChange={() => togglePort(port.id)}
                          disabled={isScanning}
                        />
                        <label
                          htmlFor={`port-${port.id}`}
                          className="text-sm text-cyber-gray cursor-pointer"
                        >
                          {port.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedPorts.length === 0 && (
                    <p className="text-xs text-cyber-red">Select at least one port</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="cyber-btn flex-1" 
                    disabled={isScanning || selectedPorts.length === 0}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Real-Time Scanning...
                      </>
                    ) : (
                      "Start Real-Time Port Scan"
                    )}
                  </Button>
                  
                  {isScanning && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={stopScan}
                    >
                      Stop
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-xl font-mono flex items-center gap-2">
              Live Scan Output
              {isScanning && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
            </CardTitle>
            <CardDescription>Real-time port scanning results with Shodan data</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={terminalRef}
              className="bg-black text-green-400 font-mono text-sm p-4 rounded-md h-80 overflow-auto border"
            >
              {scanOutput.length === 0 ? (
                <div className="text-gray-500">
                  # Real-time port scanner ready
                  <br />
                  # Select target and ports, then click Start Real-Time Port Scan
                  <br />
                  # Powered by Shodan intelligence for enhanced accuracy
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">
                  {scanOutput.join('')}
                  {isScanning && <span className="animate-pulse">█</span>}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {scanResults && (
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-xl font-mono">Real-Time Scan Results</CardTitle>
            <CardDescription>
              Target: {scanResults.target} | Time: {new Date(scanResults.startTime).toLocaleString()}
              {scanResults.shodanData && (
                <span className="ml-2 text-green-600">• Enhanced with Shodan intelligence</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Banner/Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanResults.results.map((result) => (
                  <TableRow key={result.port}>
                    <TableCell className="font-mono">{result.port}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={result.status === 'open' ? 'default' : 'secondary'}
                        className={
                          result.status === 'open' 
                            ? "bg-green-500 hover:bg-green-500/90" 
                            : result.status === 'filtered'
                            ? "bg-yellow-500 hover:bg-yellow-500/90"
                            : "bg-cyber-gray/20 text-cyber-gray hover:bg-cyber-gray/30"
                        }
                      >
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.service || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {result.banner ? result.banner.substring(0, 50) + (result.banner.length > 50 ? '...' : '') : 
                       result.version || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {scanResults.shodanData && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Shodan Intelligence Summary:
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>Organization: {scanResults.shodanData.organization || 'Unknown'}</p>
                  <p>Location: {scanResults.shodanData.city || 'Unknown'}, {scanResults.shodanData.country || 'Unknown'}</p>
                  <p>Known Open Ports: {scanResults.shodanData.open_ports?.length || 0}</p>
                  {scanResults.shodanData.vulns?.length > 0 && (
                    <p className="text-red-600 dark:text-red-400">
                      Known Vulnerabilities: {scanResults.shodanData.vulns.length}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortScanner;
