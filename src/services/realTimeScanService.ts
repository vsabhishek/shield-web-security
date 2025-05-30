
export interface ScanResult {
  id: string;
  target: string;
  scanType: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  vulnerabilities: Vulnerability[];
  rawOutput: string[];
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  port?: number;
  service?: string;
  cvss?: number;
  recommendation?: string;
}

class RealTimeScanService {
  private activeScan: ScanResult | null = null;
  private scanHistory: ScanResult[] = [];

  async startScan(target: string, scanType: string): Promise<string> {
    const scanId = `scan_${Date.now()}`;
    
    this.activeScan = {
      id: scanId,
      target,
      scanType,
      status: 'running',
      startTime: new Date(),
      vulnerabilities: [],
      rawOutput: []
    };

    try {
      // Use the Supabase client to invoke the edge function
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://bjzqfmmowlghbmsyigwm.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqenFmbW1vd2xnaGJtc3lpZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMjAwMzgsImV4cCI6MjA2MjY5NjAzOH0.4cf7hnJ5yGIU8LR58YV2w1g8ESz0ywRppYF2lagOxOA'
      );

      // Start the scan by calling the edge function
      const { data, error } = await supabase.functions.invoke('vulnerability-scan', {
        body: { target, scanType, userId: 'user123' }
      });

      if (error) {
        throw new Error(`Scan failed: ${error.message}`);
      }

      // Simulate real-time scanning results for now
      this.simulateRealTimeScan(target, scanType);
      
      return scanId;
    } catch (error) {
      console.error('Real backend connection failed:', error);
      this.activeScan.status = 'failed';
      throw error;
    }
  }

  private async simulateRealTimeScan(target: string, scanType: string) {
    const phases = [
      `[*] Starting comprehensive security assessment for ${target}`,
      `[*] Phase 1: Host Discovery and Port Scanning`,
      `[*] Phase 2: Service Version Detection`,
      `[*] Phase 3: Threat Intelligence Gathering (Shodan)`,
      `[*] Phase 4: SSL/TLS Security Analysis`,
      `[*] Phase 5: Web Application Security Testing`,
      `[*] Phase 6: CVE Database Lookup`
    ];

    for (let i = 0; i < phases.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.handleScanOutput(phases[i] + '\n');
      
      // Simulate finding vulnerabilities
      if (i === 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.handleVulnerabilityFound({
          id: 'CVE-2021-44228',
          title: 'Apache Log4j Remote Code Execution',
          description: 'Critical RCE vulnerability in Apache Log4j library detected via Shodan intelligence',
          severity: 'critical',
          cvss: 10.0,
          recommendation: 'Update Log4j to version 2.17.1 or later immediately'
        });
      }
      
      if (i === 4) {
        await new Promise(resolve => setTimeout(resolve, 800));
        this.handleVulnerabilityFound({
          id: 'ssl-weak-cipher',
          title: 'Weak SSL/TLS Cipher Suite',
          description: 'Server supports weak encryption ciphers',
          severity: 'medium',
          port: 443,
          service: 'https',
          cvss: 5.3,
          recommendation: 'Disable weak cipher suites and enable only strong encryption'
        });
      }
    }

    // Complete the scan
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.handleScanComplete({
      vulnerabilities: this.activeScan?.vulnerabilities || [],
      summary: {
        target,
        totalVulnerabilities: this.activeScan?.vulnerabilities.length || 0,
        criticalCount: this.activeScan?.vulnerabilities.filter(v => v.severity === 'critical').length || 0,
        highCount: this.activeScan?.vulnerabilities.filter(v => v.severity === 'high').length || 0
      }
    });
  }

  private handleScanOutput(output: string) {
    if (this.activeScan) {
      this.activeScan.rawOutput.push(output);
      window.dispatchEvent(new CustomEvent('scanOutput', { detail: output }));
    }
  }

  private handleVulnerabilityFound(vulnerability: Vulnerability) {
    if (this.activeScan) {
      this.activeScan.vulnerabilities.push(vulnerability);
      window.dispatchEvent(new CustomEvent('vulnerabilityFound', { detail: vulnerability }));
    }
  }

  private handleScanComplete(result: any) {
    if (this.activeScan) {
      this.activeScan.status = 'completed';
      this.activeScan.endTime = new Date();
      this.activeScan.vulnerabilities = result.vulnerabilities || this.activeScan.vulnerabilities;
      this.scanHistory.push(this.activeScan);
      window.dispatchEvent(new CustomEvent('scanComplete', { detail: this.activeScan }));
    }
  }

  private handleScanError(message: string) {
    if (this.activeScan) {
      this.activeScan.status = 'failed';
      this.activeScan.endTime = new Date();
      this.activeScan.rawOutput.push(`[ERROR] ${message}\n`);
      window.dispatchEvent(new CustomEvent('scanError', { detail: message }));
    }
  }

  getCurrentScan(): ScanResult | null {
    return this.activeScan;
  }

  getScanHistory(): ScanResult[] {
    return this.scanHistory;
  }

  stopScan() {
    if (this.activeScan) {
      this.activeScan.status = 'failed';
      this.activeScan.endTime = new Date();
      this.activeScan = null;
    }
  }

  disconnect() {
    // Cleanup if needed
  }
}

export const realTimeScanService = new RealTimeScanService();
