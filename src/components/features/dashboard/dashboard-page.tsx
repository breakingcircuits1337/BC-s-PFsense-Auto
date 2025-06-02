"use client";
import type { FC } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Bell, Wifi, ShieldCheck, AlertTriangle, Volume2, VolumeX, BarChart3, ListChecks, Info, XCircle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getPfSenseInterfaceStats, type InterfaceStatsData } from '@/app/actions/pfsense';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  timestamp: string;
  sourceIp?: string;
  destinationIp?: string;
}

const initialMockAlerts: Alert[] = [
  { id: "1", title: "Potential DDoS Attack", description: "Unusual traffic spike detected from multiple IPs.", severity: "Critical", timestamp: "2024-06-02T05:26:39.904Z", sourceIp: "Multiple", destinationIp: "192.168.1.100" },
  { id: "2", title: "Malware Signature Detected", description: "Known malware signature matched on host 192.168.1.15.", severity: "High", timestamp: "2024-06-02T05:01:39.904Z", sourceIp: "192.168.1.15", destinationIp: "N/A" },
  { id: "3", title: "Unauthorized Access Attempt", description: "Failed login attempts on server 'WEB-SRV-01'.", severity: "Medium", timestamp: "2024-06-02T03:31:39.904Z", sourceIp: "103.22.10.5", destinationIp: "192.168.1.50" },
  { id: "4", title: "Outdated Software Vulnerability", description: "Host 192.168.1.22 running outdated Apache version.", severity: "Low", timestamp: "2024-06-01T05:31:39.904Z", sourceIp: "192.168.1.22", destinationIp: "N/A" },
];

const severityVariantMap = {
  Critical: "destructive",
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
} as const;

const severityIconMap: Record<Alert["severity"], JSX.Element> = {
  Critical: <AlertTriangle className="h-4 w-4 text-destructive-foreground" />,
  High: <AlertTriangle className="h-4 w-4 text-destructive-foreground" />,
  Medium: <AlertTriangle className="h-4 w-4 text-secondary-foreground" />,
  Low: <Info className="h-4 w-4 text-foreground" />,
};

type TrafficDataPoint = { time: string; upload: number; download: number };

const chartConfig = {
  upload: {
    label: "Upload (KB/s)",
    color: "hsl(var(--chart-1))",
  },
  download: {
    label: "Download (KB/s)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const MAX_TRAFFIC_POINTS = 30;
const INTERFACE_TO_MONITOR = 'wan';
const TRAFFIC_FETCH_INTERVAL = 10000;

const timeSince = (dateString: string) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.max(0, Math.floor(seconds)) + "s ago";
};

const ClientTimeRenderer: FC<{ timestamp: string; formatter: (ts: string) => string | JSX.Element }> = ({ timestamp, formatter }) => {
  const [renderedTime, setRenderedTime] = useState<string | JSX.Element | null>(null);

  useEffect(() => {
    setRenderedTime(formatter(timestamp));
  }, [timestamp, formatter]);

  return <>{renderedTime}</>;
};

export const DashboardPage: FC = () => {
  const [verbalNotifications, setVerbalNotifications] = useState(false);
  const [systemHealth, setSystemHealth] = useState(0);
  const [activeThreats, setActiveThreats] = useState(0);
  const [detailedAlert, setDetailedAlert] = useState<Alert | null>(null);
  const [displayedAlerts, setDisplayedAlerts] = useState<Alert[]>(() => initialMockAlerts);

  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(true);
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const previousStatsRef = useRef<{ timestamp: number; inbytes: number; outbytes: number } | null>(null);

  useEffect(() => {
    setActiveThreats(displayedAlerts.filter(a => a.severity === "Critical" || a.severity === "High").length);
  }, [displayedAlerts]);

  useEffect(() => {
    const fetchTraffic = async () => {
      if (!isLoadingTraffic) setIsLoadingTraffic(true);

      try {
        const result = await getPfSenseInterfaceStats(INTERFACE_TO_MONITOR);
        if (result.success && result.data) {
          setTrafficError(null);
          const currentServerTime = new Date();
          const currentTimestamp = currentServerTime.getTime();
          const { inbytes, outbytes } = result.data;

          let newTimeString = '';
          if (typeof window !== 'undefined') {
            newTimeString = currentServerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          }

          if (previousStatsRef.current) {
            const prev = previousStatsRef.current;
            const timeDiffSeconds = (currentTimestamp - prev.timestamp) / 1000;

            if (timeDiffSeconds > 0) {
              const downloadRateBytes = (inbytes - prev.inbytes) / timeDiffSeconds;
              const uploadRateBytes = (outbytes - prev.outbytes) / timeDiffSeconds;
              
              setTrafficData(prevData => {
                const newDataPoint = {
                  time: newTimeString || prevData[prevData.length -1]?.time || '...',
                  download: Math.max(0, downloadRateBytes / 1024),
                  upload: Math.max(0, uploadRateBytes / 1024),
                };
                const updatedData = [...prevData, newDataPoint];
                return updatedData.slice(-MAX_TRAFFIC_POINTS);
              });
            }
          }
          previousStatsRef.current = { timestamp: currentTimestamp, inbytes, outbytes };
        } else {
          console.warn("Failed to fetch or parse traffic data:", result.error);
          setTrafficError(result.error || `Failed to fetch traffic data for ${INTERFACE_TO_MONITOR}. Ensure pfSense API is configured and the endpoint is correct.`);
        }
      } catch (error) {
        console.error("Error in fetchTraffic:", error);
        setTrafficError(error instanceof Error ? error.message : "Unknown error fetching traffic data.");
      } finally {
        setIsLoadingTraffic(false);
      }
    };

    fetchTraffic();
    const intervalId = setInterval(fetchTraffic, TRAFFIC_FETCH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isLoadingTraffic]);

  const handleVerbalNotificationToggle = (checked: boolean) => {
    setVerbalNotifications(checked);
    console.log(`Verbal notifications ${checked ? "enabled" : "disabled"}`);
  };
  
  const handleDismissAlert = (alertId: string) => {
    setDisplayedAlerts(currentAlerts => currentAlerts.filter(alert => alert.id !== alertId));
    if (detailedAlert && detailedAlert.id === alertId) {
      setDetailedAlert(null); 
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Label htmlFor="verbal-notifications" className="text-sm font-medium">
            Verbal Alerts
          </Label>
          <Switch
            id="verbal-notifications"
            checked={verbalNotifications}
            onCheckedChange={handleVerbalNotificationToggle}
            aria-label="Toggle verbal notifications"
          />
          {verbalNotifications ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
            <Wifi className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Unknown</div>
            <p className="text-xs text-muted-foreground">Configure API to see live status.</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{systemHealth}%</div>
            <Progress value={systemHealth} aria-label={`${systemHealth}% system health`} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Critical/High Alerts</CardTitle>
            <Bell className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeThreats}</div>
            <p className="text-xs text-muted-foreground">Based on displayed alerts</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />Network Traffic Overview</CardTitle>
            <CardDescription>Summary of network activity for '{INTERFACE_TO_MONITOR}' interface.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-0 relative">
             {isLoadingTraffic && trafficData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading traffic data...</span>
                </div>
            )}
            {trafficError && !isLoadingTraffic && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 z-10 p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-destructive mb-2"/>
                    <p className="text-destructive text-sm font-semibold">Error loading traffic data:</p>
                    <p className="text-destructive/80 text-xs">{trafficError}</p>
                </div>
            )}
            {!isLoadingTraffic && !trafficError && trafficData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                    <p className="text-muted-foreground">No traffic data available. Waiting for first data points...</p>
                </div>
            )}
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={trafficData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  tickFormatter={(value) => { 
                    if (value === 0) return "0";
                    if (value < 1) return `${(value * 1024).toFixed(0)} B/s`;
                    if (value < 1024) return `${value.toFixed(1)} KB/s`;
                    const mbps = value / 1024;
                    return `${mbps.toFixed(1)} MB/s`;
                  }}
                />
                <RechartsTooltip 
                  content={<ChartTooltipContent 
                    indicator="dot" 
                    formatter={(value, name) => {
                      let formattedValue = "";
                      const numValue = Number(value);
                      if (numValue < 1 && numValue > 0) formattedValue = `${(numValue * 1024).toFixed(0)} B/s`;
                      else if (numValue < 1024) formattedValue = `${numValue.toFixed(1)} KB/s`;
                      else formattedValue = `${(numValue / 1024).toFixed(1)} MB/s`;
                      return [formattedValue, chartConfig[name as keyof typeof chartConfig]?.label || name];
                    }}
                  />} 
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="upload"
                  type="natural"
                  fill="var(--color-upload)"
                  fillOpacity={0.3}
                  stroke="var(--color-upload)"
                  stackId="1"
                  isAnimationActive={false}
                />
                <Area
                  dataKey="download"
                  type="natural"
                  fill="var(--color-download)"
                  fillOpacity={0.3}
                  stroke="var(--color-download)"
                  stackId="1"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary" />Recent Security Alerts</CardTitle>
            <CardDescription>Latest security events.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAlerts.slice(0,5).map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge variant={severityVariantMap[alert.severity]} className="gap-1 px-2 py-1">
                        {severityIconMap[alert.severity]}
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                       <ClientTimeRenderer timestamp={alert.timestamp} formatter={timeSince} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetailedAlert(alert)}>Details</Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDismissAlert(alert.id)} aria-label="Dismiss alert">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {displayedAlerts.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No alerts to display.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {detailedAlert && (
        <AlertDialog open={!!detailedAlert} onOpenChange={(isOpen) => { if (!isOpen) setDetailedAlert(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center justify-between">
                {detailedAlert.title}
                <Badge variant={severityVariantMap[detailedAlert.severity]} className="gap-1 ml-2 px-2 py-1">
                  {severityIconMap[detailedAlert.severity]}
                  {detailedAlert.severity}
                </Badge>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Logged: <ClientTimeRenderer timestamp={detailedAlert.timestamp} formatter={(ts) => new Date(ts).toLocaleString()} />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 my-4 text-sm">
              <p><strong className="font-medium text-foreground/90">Description:</strong> {detailedAlert.description}</p>
              {detailedAlert.sourceIp && detailedAlert.sourceIp !== "N/A" && (
                <p><strong className="font-medium text-foreground/90">Source IP:</strong> {detailedAlert.sourceIp}</p>
              )}
              {detailedAlert.destinationIp && detailedAlert.destinationIp !== "N/A" && (
                <p><strong className="font-medium text-foreground/90">Destination IP:</strong> {detailedAlert.destinationIp}</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDetailedAlert(null)}>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => {handleDismissAlert(detailedAlert.id); setDetailedAlert(null);}} className={buttonVariants({variant: "destructive"})}>Dismiss Alert</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};