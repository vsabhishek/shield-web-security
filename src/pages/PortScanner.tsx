
import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { mockScanPorts } from "@/lib/supabase";
import CyberTerminal from "@/components/CyberTerminal";

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
  const [scanResults, setScanResults] = useState<any>(null);
  const [scanOutput, setScanOutput] = useState<string[]>([]);
  const [selectedPorts, setSelectedPorts] = useState<number[]>([22, 80, 443]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target: "",
    },
  });

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
    
    // Sort ports for display
    const sortedPorts = [...selectedPorts].sort((a, b) => a - b);
    
    // Simulate terminal output
    setScanOutput([
      `[*] Starting port scan on target: ${values.target}`,
      `[*] Scanning ${selectedPorts.length} ports: ${sortedPorts.join(', ')}`,
      `[*] Initializing scan...`,
    ]);
    
    try {
      const results = await mockScanPorts(values.target, selectedPorts);
      
      // Add output lines gradually
      for (const port of sortedPorts) {
        const portResult = results.results.find((r: any) => r.port === port);
        const status = portResult.status === 'open' ? 'OPEN' : 'closed';
        
        // Add a small delay between lines
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setScanOutput(prev => [
          ...prev,
          `[*] Port ${port.toString().padEnd(5)} | ${status.padEnd(6)} ${portResult.service ? '| ' + portResult.service : ''}`,
        ]);
      }
      
      setScanOutput(prev => [
        ...prev,
        `[+] Scan completed: ${results.results.filter((r: any) => r.status === 'open').length} open ports found`,
      ]);
      
      setScanResults(results);
    } catch (error) {
      console.error("Port scan error:", error);
      setScanOutput(prev => [...prev, `[!] Error during scan: ${error}`]);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-cyber-blue font-mono">Port Scanner</h1>
        <p className="text-cyber-gray mt-2">
          Scan for open ports on target systems
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-xl font-mono">Scan Configuration</CardTitle>
            <CardDescription>
              Enter target and select ports to scan
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
                        Domain name or IP address to scan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Ports to Scan</FormLabel>
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

                <Button 
                  type="submit" 
                  className="w-full cyber-btn" 
                  disabled={isScanning || selectedPorts.length === 0}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    "Run Port Scan"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-xl font-mono">Scan Output</CardTitle>
          </CardHeader>
          <CardContent>
            <CyberTerminal 
              content={scanOutput.length > 0 ? scanOutput : "# No scan running yet\n# Select target and ports, then click Run Port Scan"} 
              className="h-80"
              typing={isScanning}
            />
          </CardContent>
        </Card>
      </div>

      {scanResults && (
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-xl font-mono">Scan Results</CardTitle>
            <CardDescription>
              Target: {scanResults.target} | Time: {new Date(scanResults.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanResults.results.map((result: any) => (
                  <TableRow key={result.port}>
                    <TableCell className="font-mono">{result.port}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={result.status === 'open' ? 'default' : 'secondary'}
                        className={
                          result.status === 'open' 
                            ? "bg-green-500 hover:bg-green-500/90" 
                            : "bg-cyber-gray/20 text-cyber-gray hover:bg-cyber-gray/30"
                        }
                      >
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.service || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortScanner;
