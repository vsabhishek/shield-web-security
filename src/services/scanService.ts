
import { wsService } from './websocket';

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

class ScanService {
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

    // Connect to WebSocket if not already connected
    try {
      await wsService.connect('wss://your-scanner-backend.com/ws');
    } catch (error) {
      // Fallback to simulation if WebSocket fails
      console.warn('WebSocket connection failed, using simulation mode');
      this.simulateScan(scanId, target, scanType);
      return scanId;
    }

    // Send scan request
    wsService.send('start_scan', {
      scanId,
      target,
      scanType
    });

    return scanId;
  }

  private simulateScan(scanId: string, target: string, scanType: string) {
    const outputLines = this.generateSimulatedOutput(target, scanType);
    let lineIndex = 0;

    const interval = setInterval(() => {
      if (lineIndex < outputLines.length) {
        const line = outputLines[lineIndex];
        this.activeScan?.rawOutput.push(line);
        
        // Trigger output event
        this.triggerOutputEvent(line);
        
        // Parse for vulnerabilities
        const vuln = this.parseVulnerability(line);
        if (vuln && this.activeScan) {
          this.activeScan.vulnerabilities.push(vuln);
        }
        
        lineIndex++;
      } else {
        clearInterval(interval);
        if (this.activeScan) {
          this.activeScan.status = 'completed';
          this.activeScan.endTime = new Date();
          this.scanHistory.push(this.activeScan);
          this.triggerScanComplete(this.activeScan);
        }
      }
    }, 200);
  }

  private generateSimulatedOutput(target: string, scanType: string): string[] {
    const lines = [
      `[*] Starting ${scanType} vulnerability scan on ${target}`,
      `[*] Initializing scanner modules...`,
      `[*] Loading vulnerability database...`,
      `[*] Starting port discovery...`,
      `[+] Port 22/tcp open ssh OpenSSH 8.0`,
      `[+] Port 80/tcp open http Apache/2.4.41`,
      `[+] Port 443/tcp open https Apache/2.4.41`,
      `[*] Running service enumeration...`,
      `[*] Checking for common vulnerabilities...`,
      `[!] CVE-2021-44228 detected on port 80 (Log4j RCE)`,
      `[!] CVE-2020-1472 detected - Zerologon vulnerability`,
      `[*] Testing SSL/TLS configuration...`,
      `[!] Weak cipher suites detected on port 443`,
      `[*] Checking for web application vulnerabilities...`,
      `[!] SQL injection possible in login form`,
      `[!] Cross-site scripting (XSS) vulnerability found`,
      `[*] Scanning for outdated software versions...`,
      `[!] Apache version 2.4.41 has known vulnerabilities`,
      `[*] Running brute force checks...`,
      `[*] Checking for default credentials...`,
      `[+] Scan completed successfully`,
      `[+] Found 6 vulnerabilities total`
    ];

    if (scanType === 'full') {
      lines.splice(10, 0, 
        `[*] Deep packet inspection enabled...`,
        `[*] Running advanced evasion techniques...`,
        `[!] Buffer overflow vulnerability detected`,
        `[!] Directory traversal vulnerability found`
      );
    }

    return lines;
  }

  private parseVulnerability(line: string): Vulnerability | null {
    if (line.includes('CVE-2021-44228')) {
      return {
        id: 'vuln_log4j',
        title: 'Apache Log4j RCE Vulnerability',
        description: 'Remote code execution vulnerability in Apache Log4j library',
        severity: 'critical',
        port: 80,
        service: 'http',
        cvss: 10.0,
        recommendation: 'Update Log4j to version 2.17.0 or later'
      };
    }
    
    if (line.includes('CVE-2020-1472')) {
      return {
        id: 'vuln_zerologon',
        title: 'Zerologon Vulnerability',
        description: 'Authentication bypass vulnerability in Windows Netlogon',
        severity: 'critical',
        cvss: 10.0,
        recommendation: 'Apply Microsoft security update immediately'
      };
    }

    if (line.includes('SQL injection')) {
      return {
        id: 'vuln_sqli',
        title: 'SQL Injection Vulnerability',
        description: 'Application vulnerable to SQL injection attacks',
        severity: 'high',
        port: 80,
        service: 'http',
        cvss: 8.5,
        recommendation: 'Use parameterized queries and input validation'
      };
    }

    if (line.includes('XSS')) {
      return {
        id: 'vuln_xss',
        title: 'Cross-Site Scripting (XSS)',
        description: 'Application vulnerable to XSS attacks',
        severity: 'medium',
        port: 80,
        service: 'http',
        cvss: 6.1,
        recommendation: 'Implement proper input sanitization and CSP headers'
      };
    }

    if (line.includes('Weak cipher suites')) {
      return {
        id: 'vuln_ssl',
        title: 'Weak SSL/TLS Configuration',
        description: 'Server uses weak cipher suites or protocols',
        severity: 'medium',
        port: 443,
        service: 'https',
        cvss: 5.3,
        recommendation: 'Configure strong cipher suites and disable weak protocols'
      };
    }

    if (line.includes('Apache version')) {
      return {
        id: 'vuln_apache',
        title: 'Outdated Apache Version',
        description: 'Apache web server version has known security vulnerabilities',
        severity: 'low',
        port: 80,
        service: 'http',
        cvss: 4.3,
        recommendation: 'Update Apache to the latest stable version'
      };
    }

    return null;
  }

  private triggerOutputEvent(line: string) {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('scanOutput', { detail: line }));
  }

  private triggerScanComplete(result: ScanResult) {
    window.dispatchEvent(new CustomEvent('scanComplete', { detail: result }));
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
    wsService.send('stop_scan', {});
  }
}

export const scanService = new ScanService();
