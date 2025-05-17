"use client";
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Wifi, ShieldCheck, AlertTriangle, Volume2, VolumeX, BarChart3, ListChecks } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  timestamp: string;
  sourceIp?: string;
  destinationIp?: string;
}

const mockAlerts: Alert[] = [
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

const severityIconMap = {
  Critical: <AlertTriangle className="h-4 w-4 text-destructive-foreground" />,
  High: <AlertTriangle className="h-4 w-4 text-destructive-foreground" />,
  Medium: <AlertTriangle className="h-4 w-4 text-secondary-foreground" />,
  Low: <AlertTriangle className="h-4 w-4 text-foreground" />,
};

export const DashboardPage: FC = () => {
  const [verbalNotifications, setVerbalNotifications] = useState(false);
  const [systemHealth, setSystemHealth] = useState(0);
  const [activeThreats, setActiveThreats] = useState(0);

  useEffect(() => {
    // Simulate fetching data
    setSystemHealth(92);
    setActiveThreats(mockAlerts.filter(a => a.severity === "Critical" || a.severity === "High").length);
  }, []);

  const handleVerbalNotificationToggle = (checked: boolean) => {
    setVerbalNotifications(checked);
    // Here you would integrate with a TTS service if available
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
            <Wifi className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Online</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <ShieldCheck className="h-5 w-5 text-accent" />
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
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />Network Traffic Overview</CardTitle>
            <CardDescription>Summary of network activity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <Image src="https://placehold.co/600x300.png" alt="Network Traffic Chart Placeholder" width={600} height={300} className="rounded-md object-cover" data-ai-hint="network chart" />
             {/* Placeholder for actual chart */}
          </CardContent>
        </Card>

        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary" />Recent Security Alerts</CardTitle>
            <CardDescription>Latest security events and notifications.</CardDescription>
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
                {mockAlerts.slice(0,5).map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge variant={severityVariantMap[alert.severity]} className="gap-1 px-2 py-1">
                        {severityIconMap[alert.severity]}
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeSince(alert.timestamp)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {mockAlerts.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No alerts to display.</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};
