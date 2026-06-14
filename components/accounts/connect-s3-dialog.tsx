"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConnectS3DialogProps {
  onConnected: () => void;
}

export function ConnectS3Dialog({ onConnected }: ConnectS3DialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    endpoint: "",
    bucket: "",
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    label: "",
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "s3", ...form }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Connection failed");
      }

      toast.success("S3 storage connected");
      setOpen(false);
      onConnected();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">🟠 S3 Compatible</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect S3 Storage</DialogTitle>
          <DialogDescription>
            Enter your S3-compatible storage credentials
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              placeholder="My S3 Bucket"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Input
              placeholder="https://s3.amazonaws.com"
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Bucket</Label>
            <Input
              value={form.bucket}
              onChange={(e) => setForm({ ...form, bucket: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Access Key ID</Label>
            <Input
              value={form.accessKeyId}
              onChange={(e) => setForm({ ...form, accessKeyId: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Secret Access Key</Label>
            <Input
              type="password"
              value={form.secretAccessKey}
              onChange={(e) => setForm({ ...form, secretAccessKey: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
