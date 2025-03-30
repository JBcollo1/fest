import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgeCheck, X, RefreshCw, QrCode, Camera, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const QRScanner = () => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [verification, setVerification] = useState({ status: null, message: '', ticketData: null });
  const [history, setHistory] = useState([]);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [activeTab, setActiveTab] = useState('scanner');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerIntervalRef = useRef(null);

  // Start camera when scanning is enabled
  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanning]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: 'environment' }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraPermission(true);
      
      // Load jsQR dynamically
      await loadJsQR();
      
      // Start scanning interval
      scannerIntervalRef.current = setInterval(scanQRCode, 500);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission(false);
      setScanning(false);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan QR codes.",
        variant: "destructive"
      });
    }
  };

  const loadJsQR = async () => {
    if (!window.jsQR) {
      try {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
        script.async = true;

        const loadPromise = new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("jsQR library loaded successfully.");
            resolve();
          };
          script.onerror = () => {
            console.error("Failed to load jsQR library.");
            reject(new Error("Failed to load jsQR library."));
          };
        });

        document.body.appendChild(script);
        await loadPromise;
      } catch (error) {
        console.error('Error loading jsQR library:', error);
        toast({
          title: "Error",
          description: "Failed to load QR scanning library.",
          variant: "destructive"
        });
      }
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !window.jsQR) return;
    
    const video = videoRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    canvas.width = width;
    canvas.height = height;
    canvasContext.drawImage(video, 0, 0, width, height);
    
    const imageData = canvasContext.getImageData(0, 0, width, height);
    const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    
    if (code && code.data) {
      clearInterval(scannerIntervalRef.current);
      setScannedCode(code.data);
      verifyTicket(code.data);
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (scannerIntervalRef.current) {
      clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }
  };

  const verifyTicket = async (ticketId) => {
    setLoading(true);
    setVerification({ status: null, message: '', ticketData: null });
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tickets/${ticketId}/verify`,
        {},
        {
          withCredentials: true,
          
        }
      );
      
      if (response.status === 200) {
        setVerification({
          status: 'success',
          message: response.data.message || 'Ticket verified successfully!',
          ticketData: response.data.data
        });
        
        // Add to history
        setHistory(prev => [{
          id: ticketId,
          timestamp: new Date().toISOString(),
          status: 'success',
          details: response.data.data
        }, ...prev.slice(0, 19)]);
        
        toast({
          title: "Success",
          description: "Ticket verified successfully!",
          variant: "default"
        });
      } else {
        setVerification({
          status: 'error',
          message: response.data.message || 'Invalid ticket',
          ticketData: null
        });
        
        // Add to history
        setHistory(prev => [{
          id: ticketId,
          timestamp: new Date().toISOString(),
          status: 'error',
          details: { error: response.data.message }
        }, ...prev.slice(0, 19)]);
        
        toast({
          title: "Error",
          description: response.data.message || 'Failed to verify ticket',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      
      setVerification({
        status: 'error',
        message: 'Network error. Please try again.',
        ticketData: null
      });
      
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedCode(null);
    setVerification({ status: null, message: '', ticketData: null });
    setScanning(true);
  };

  const manualEntry = () => {
    const ticketId = prompt('Enter ticket ID:');
    if (ticketId) {
      setScannedCode(ticketId);
      verifyTicket(ticketId);
    }
  };

  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="max-w-md mx-auto">
      <Tabs defaultValue="scanner" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Scanner</CardTitle>
              <CardDescription>
                Scan QR codes to verify tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!scanning && !scannedCode ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 border-2 border-dashed rounded-lg">
                  <QrCode className="w-16 h-16 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    Ready to scan tickets
                  </p>
                  <Button onClick={() => setScanning(true)}>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </Button>
                </div>
              ) : scanning ? (
                <div className="relative">
                  <div className="aspect-square overflow-hidden rounded-lg border">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover"
                      autoPlay 
                      playsInline
                    />
                  </div>
                  <div className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none" />
                  
                  <Button 
                    variant="outline" 
                    className="absolute bottom-4 right-4"
                    onClick={() => setScanning(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : scannedCode ? (
                <div className="space-y-4">
                  {verification.status === 'success' ? (
                    <Alert variant="default" className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Valid Ticket</AlertTitle>
                      <AlertDescription className="text-green-700">
                        {verification.message}
                      </AlertDescription>
                    </Alert>
                  ) : verification.status === 'error' ? (
                    <Alert variant="destructive">
                      <X className="h-4 w-4" />
                      <AlertTitle>Invalid Ticket</AlertTitle>
                      <AlertDescription>
                        {verification.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="flex justify-center p-4">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {verification.ticketData && (
                    <Card className="border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-green-700">
                          Ticket Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <p className="font-medium">Event:</p>
                          <p>{verification.ticketData.event?.title || 'N/A'}</p>
                          
                          <p className="font-medium">Date:</p>
                          <p>{verification.ticketData.event ? formatDateTime(verification.ticketData.event.start_time) : 'N/A'}</p>
                          
                          <p className="font-medium">Ticket ID:</p>
                          <p className="font-mono">{verification.ticketData.id}</p>
                          
                          <p className="font-medium">Attendee:</p>
                          <p>{verification.ticketData.attendee_name || 'N/A'}</p>
                          
                          <p className="font-medium">Ticket Type:</p>
                          <p>{verification.ticketData.ticket_type || 'Standard'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={manualEntry}>
                Manual Entry
              </Button>
              
              {scannedCode && (
                <Button onClick={resetScanner}>
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Another
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>
                Recent ticket scans
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No scan history yet
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((item, index) => (
                    <div key={index} className="p-4 flex items-start space-x-3">
                      {item.status === 'success' ? (
                        <BadgeCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-mono text-sm truncate">
                            {item.id}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          {item.status === 'success' 
                            ? item.details?.event?.title || 'Ticket verified' 
                            : item.details?.error || 'Verification failed'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setHistory([])}
                disabled={history.length === 0}
              >
                Clear History
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QRScanner;