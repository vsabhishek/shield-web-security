
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
  private ws: WebSocket | null = null;
  private activeScan: ScanResult | null = null;
  private scanHistory: ScanResult[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

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
      await this.connectToRealBackend(target, scanType);
    } catch (error) {
      console.error('Real backend connection failed:', error);
      this.activeScan.status = 'failed';
      throw error;
    }

    return scanId;
  }

  private async connectToRealBackend(target: string, scanType: string): Promise<void> {
    const wsUrl = `wss://bjzqfmmowlghbmsyigwm.functions.supabase.co/functions/v1/vulnerability-scan`;
    
    return new Promise((resolve, reject) => {
      try {
        // Send scan request via POST first, then upgrade to WebSocket
        fetch(`https://bjzqfmmowlghbmsyigwm.functions.supabase.co/functions/v1/vulnerability-scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Upgrade': 'websocket',
            'Connection': 'Upgrade'
          },
          body: JSON.stringify({
            target,
            scanType,
            userId: 'user123' // This would come from auth context
          })
        }).then(response => {
          console.log('Scan request sent, response:', response.status);
        });

        // Connect via WebSocket for real-time updates
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('Connected to real vulnerability scanning backend');
          this.reconnectAttempts = 0;
          this.setupWebSocketHandlers();
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          reject(new Error('Failed to connect to vulnerability scanning backend'));
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connectToRealBackend(target, scanType);
            }, 2000 * this.reconnectAttempts);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        // Handle raw text output
        this.handleScanOutput(event.data);
      }
    };
  }

  private handleWebSocketMessage(data: any) {
    console.log('Received WebSocket message:', data);
    
    switch (data.type) {
      case 'scan_output':
        this.handleScanOutput(data.data);
        break;
      case 'vulnerability_found':
        this.handleVulnerabilityFound(data.vulnerability);
        break;
      case 'scan_complete':
        this.handleScanComplete(data);
        break;
      case 'error':
        this.handleScanError(data.message);
        break;
    }
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
    if (this.ws) {
      this.ws.close();
    }
    if (this.activeScan) {
      this.activeScan.status = 'failed';
      this.activeScan.endTime = new Date();
      this.activeScan = null;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realTimeScanService = new RealTimeScanService();
