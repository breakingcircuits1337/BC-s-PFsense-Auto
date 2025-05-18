
"use client";
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Bell, Wifi, ShieldCheck, AlertTriangle, Volume2, VolumeX, BarChart3, ListChecks, Info, XCircle } from "lucide-react";
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
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

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
  { id: "1", title: "Potential DDoS Attack", description: "Unusual traffic spike detected from multiple IPs.", severity: "Critical", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), sourceIp: "Multiple", destinationIp: "192.168.1.100" },
  { id: "2", title: "Malware Signature Detected", description: "Known malware signature matched on host 192.168.1.15.", severity: "High", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), sourceIp: "192.168.1.15", destinationIp: "N/A" },
  { id: "3", title: "Unauthorized Access Attempt", description: "Failed login attempts on server 'WEB-SRV-01'.", severity: "Medium", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), sourceIp: "103.22.10.5", destinationIp: "192.168.1.50" },
  { id: "4", title: "Outdated Software Vulnerability", description: "Host 192.168.1.22 running outdated Apache version.", severity: "Low", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), sourceIp: "192.168.1.22", destinationIp: "N/A" },
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

const mockTrafficData = [
  { time: '10:00', upload: 400000, download: 240000 },
  { time: '10:05', upload: 300000, download: 139800 },
  { time: '10:10', upload: 200000, download: 980000 },
  { time: '10:15', upload: 278000, download: 390800 },
  { time: '10:20', upload: 189000, download: 480000 },
  { time: '10:25', upload: 239000, download: 380000 },
  { time: '10:30', upload: 349000, download: 430000 },
];

const chartConfig = {
  upload: {
    label: "Upload",
    color: "hsl(var(--chart-1))",
  },
  download: {
    label: "Download",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export const DashboardPage: FC = () => {
  const [verbalNotifications, setVerbalNotifications] = useState(false);
  const [systemHealth, setSystemHealth] = useState(0);
  const [activeThreats, setActiveThreats] = useState(0);
  const [detailedAlert, setDetailedAlert] = useState<Alert | null>(null);
  const [displayedAlerts, setDisplayedAlerts] = useState<Alert[]>(initialMockAlerts);

  useEffect(() => {
    setActiveThreats(displayedAlerts.filter(a => a.severity === "Critical" || a.severity === "High").length);
  }, [displayedAlerts]);

  const handleVerbalNotificationToggle = (checked: boolean) => {
    setVerbalNotifications(checked);
    // In a real app, you might initialize or stop a TTS service here
    console.log(`Verbal notifications ${checked ? "enabled" : "disabled"}`);
  };
  
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
    return Math.floor(seconds) + "s ago";
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
            <CardDescription>Summary of network activity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-0">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={mockTrafficData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const numValue = Number(value);
                    const kb = numValue / 1024;
                    if (kb < 1) return `${numValue} B`;
                    if (kb < 1024) return `${kb.toFixed(0)} KB`;
                    const mb = kb / 1024;
                    if (mb < 1024) return `${mb.toFixed(1)} MB`;
                    const gb = mb / 1024;
                    return `${gb.toFixed(1)} GB`;
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="upload"
                  type="natural"
                  fill="var(--color-upload)"
                  fillOpacity={0.3}
                  stroke="var(--color-upload)"
                  stackId="1"
                />
                <Area
                  dataKey="download"
                  type="natural"
                  fill="var(--color-download)"
                  fillOpacity={0.3}
                  stroke="var(--color-download)"
                  stackId="1"
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
                    <TableCell className="text-xs text-muted-foreground">{timeSince(alert.timestamp)}</TableCell>
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
                Logged: {new Date(detailedAlert.timestamp).toLocaleString()}
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
