"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Hourglass } from 'lucide-react';

export default function SessionTimer({ 
  sessionId, 
  startTime, 
  ratePerMinute, 
  isActive = true,
  sessionType
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  
  useEffect(() => {
    let timer;
    
    if (isActive && startTime) {
      // Calculate initial elapsed time (in case of rejoining an active session)
      const initialElapsedSeconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsedTime(initialElapsedSeconds);
      
      // Update elapsed time every second
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, startTime]);
  
  useEffect(() => {
    // Calculate cost: convert seconds to minutes (rounded up) * rate
    const minutes = Math.ceil(elapsedTime / 60);
    setCurrentCost(minutes * ratePerMinute);
  }, [elapsedTime, ratePerMinute]);
  
  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className={`border-2 ${isActive ? 'border-primary' : 'border-muted'}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hourglass className={`h-5 w-5 ${isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
          <div>
            <Badge
              variant={sessionType === 'chat' ? 'outline' : 'default'}
              className="mr-2"
            >
              {sessionType === 'chat' ? 'Chat' : 'Call'}
            </Badge>
            <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            Rate: ₹{ratePerMinute}/min
          </div>
          <div className="font-bold">
            ₹{currentCost.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 