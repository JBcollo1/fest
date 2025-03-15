import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine, User, Calendar, Check, X as XIcon, Camera } from "lucide-react";

// Import QR code scanning library
import jsQR from "jsqr";

export const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedTicket, setScannedTicket] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Function to start the camera
  const startCamera = async () => {
    setCameraError(null);
    setScanning(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start scanning loop
      requestAnimationFrame(scanQRCode);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Could not access camera. Please check permissions.");
      setScanning(false);
    }
  };
  
  // Function to stop the camera
  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setScanning(false);
  };
  
  // Function to scan QR code from video feed
  const scanQRCode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Check if video is ready
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for QR code detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Attempt to find QR code in the image
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });
      
      // If QR code is found
      if (code) {
        try {
          // Parse the QR code data (assuming it's a JSON string)
          const ticketData = JSON.parse(code.data);
          
          // Stop camera and processing
          stopCamera();
          
          // Set the scanned ticket data
          setScannedTicket({
            id: ticketData.id || "Unknown ID",
            eventName: ticketData.eventName || "Unknown Event",
            attendeeName: ticketData.attendeeName || "Unknown Attendee",
            attendeeEmail: ticketData.attendeeEmail || "",
            ticketType: ticketData.ticketType || "Standard",
            status: ticketData.status || "valid"
          });
          
          return;
        } catch (error) {
          console.error("Invalid QR code format:", error);
          // Continue scanning if the QR code format was invalid
        }
      }
    }
    
    // If no QR code found or invalid format, continue scanning
    requestAnimationFrame(scanQRCode);
  };
  
  // Mock function for demo purposes
  const handleScanMock = () => {
    setScanning(true);
    
    // Simulate a delay for scanning
    setTimeout(() => {
      setScanning(false);
      
      // Mock data - in a real app, this would come from the QR code
      setScannedTicket({
        id: "TKT-" + Math.floor(Math.random() * 10000),
        eventName: "Summer Music Festival",
        attendeeName: "Jane Smith",
        attendeeEmail: "jane@example.com",
        ticketType: "VIP Pass",
        status: "valid"
      });
    }, 2000);
  };

  const handleCheckIn = () => {
    if (scannedTicket) {
      setScannedTicket({
        ...scannedTicket,
        status: "used"
      });
    }
  };

  const handleReset = () => {
    setScannedTicket(null);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">QR Ticket Scanner</h1>
      
      <Card className="p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/50 overflow-hidden relative">
            {scanning ? (
              <>
                <video 
                  ref={videoRef} 
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                />
                <canvas 
                  ref={canvasRef} 
                  className="hidden"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 bg-black/30 p-4 rounded">
                    <ScanLine className="w-16 h-16 text-primary mx-auto animate-pulse" />
                    <p className="text-white">Scanning QR Code...</p>
                  </div>
                </div>
              </>
            ) : scannedTicket ? (
              <div className="text-center space-y-2">
                <Badge variant={scannedTicket.status === "valid" ? "default" : scannedTicket.status === "used" ? "secondary" : "destructive"} className="mx-auto text-base py-1 px-3">
                  {scannedTicket.status === "valid" ? "Valid Ticket" : 
                   scannedTicket.status === "used" ? "Already Checked In" : "Invalid Ticket"}
                </Badge>
                <p className="text-xl font-bold mt-2">{scannedTicket.id}</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <ScanLine className="w-16 h-16 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No ticket scanned</p>
                {cameraError && <p className="text-red-500 text-sm">{cameraError}</p>}
              </div>
            )}
          </div>
          
          {!scannedTicket ? (
            <div className="w-full max-w-md space-y-2">
              <Button 
                onClick={startCamera} 
                disabled={scanning}
                className="w-full"
                variant="default"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan with Camera
              </Button>
              <Button 
                onClick={handleScanMock} 
                disabled={scanning}
                className="w-full"
                variant="outline"
              >
                Demo Mode (Mock Scan)
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-4 bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Event</span>
                  <span>{scannedTicket.eventName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Attendee</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{scannedTicket.attendeeName}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Email</span>
                  <span className="text-sm truncate max-w-[200px]">{scannedTicket.attendeeEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ticket Type</span>
                  <span>{scannedTicket.ticketType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={scannedTicket.status === "valid" ? "default" : scannedTicket.status === "used" ? "secondary" : "destructive"}>
                    {scannedTicket.status.charAt(0).toUpperCase() + scannedTicket.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                {scannedTicket.status === "valid" && (
                  <Button 
                    onClick={handleCheckIn}
                    className="flex-1"
                    variant="default"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Check In
                  </Button>
                )}
                <Button 
                  onClick={handleReset}
                  className="flex-1"
                  variant={scannedTicket.status === "valid" ? "outline" : "default"}
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  {scannedTicket.status === "valid" ? "Cancel" : "Scan New Ticket"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};