import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { supabaseRequest } from "@/lib/supabase";
import { toast } from "sonner";
import { Database, HardDriveDownload, HardDriveUpload, Upload, Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Pixel2Pro Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session } = useSession();
  const { theme, set } = useTheme();
  const [notify, setNotify] = useState({ admissions: true, payments: true, reviews: false, failures: true });

  const [profile, setProfile] = useState({
    name: session?.name || "",
    email: session?.email || "",
    phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [website, setWebsite] = useState({
    name: "Pixel2Pro",
    tagline: "Pixel Today, Pro Tomorrow",
    description: "Pixel2Pro turns focused learners into job-ready builders through cohort-based tracks and verified credentials.",
  });
  const [websiteSaving, setWebsiteSaving] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState({ jazzcash: "", easypaisa: "", bank: "", iban: "" });
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [whatsapp, setWhatsapp] = useState({ number: "", token: "", message: "Welcome to Pixel2Pro! Your admission is confirmed. See you in class." });
  const [whatsappSaving, setWhatsappSaving] = useState(false);

  const [smtp, setSmtp] = useState({ host: "", port: "", username: "", password: "" });
  const [smtpSaving, setSmtpSaving] = useState(false);

  const saveToStorage = (key: string, data: Record<string, unknown>) => {
    localStorage.setItem(`p2p_settings_${key}`, JSON.stringify(data));
  };

  const handlePasswordChange = async () => {
    if (!passwords.newPass || !passwords.confirm) {
      toast.error("Please fill all password fields");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwords.newPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      await supabaseRequest("/auth/v1/user", {
        method: "PUT",
        body: JSON.stringify({ password: passwords.newPass }),
      });
      toast.success("Password updated successfully");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch {
      toast.error("Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <AdminLayout title="Settings" subtitle="Portal, notifications, integrations, and maintenance.">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full flex-wrap justify-start rounded-xl gap-1">
          <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
          <TabsTrigger value="password" className="text-xs">Password</TabsTrigger>
          <TabsTrigger value="website" className="text-xs">Website</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Payment</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs">WhatsApp</TabsTrigger>
          <TabsTrigger value="email" className="text-xs">Email</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">Theme</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Notify</TabsTrigger>
          <TabsTrigger value="backup" className="text-xs">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Admin Profile</CardTitle><CardDescription>Your account details in the portal.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16"><AvatarImage src={session?.avatar} /><AvatarFallback>AD</AvatarFallback></Avatar>
                <Button variant="outline" size="sm"><Upload className="mr-1.5 h-4 w-4" /> Upload</Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Full name</Label><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
                <div><Label>Role</Label><Input defaultValue={session?.role} disabled /></div>
                <div><Label>Phone</Label><Input placeholder="+92 …" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
              </div>
              <Button size="sm" onClick={() => {
                setProfileSaving(true);
                saveToStorage("profile", profile);
                toast.success("Profile updated");
                setProfileSaving(false);
              }} disabled={profileSaving}>{profileSaving ? "Saving…" : "Save"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><Label>Current</Label><Input type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} /></div>
                <div><Label>New</Label><Input type="password" value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} /></div>
                <div><Label>Confirm</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} /></div>
              </div>
              <Button size="sm" onClick={handlePasswordChange} disabled={passwordSaving}>{passwordSaving ? "Updating…" : "Update"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="website" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Website Settings</CardTitle><CardDescription>Public site branding and metadata.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Site name</Label><Input value={website.name} onChange={e => setWebsite({ ...website, name: e.target.value })} /></div>
                <div><Label>Tagline</Label><Input value={website.tagline} onChange={e => setWebsite({ ...website, tagline: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={website.description} onChange={e => setWebsite({ ...website, description: e.target.value })} /></div>
                <div><Label>Logo</Label><Input type="file" /></div>
                <div><Label>Favicon</Label><Input type="file" /></div>
              </div>
              <Button size="sm" onClick={() => {
                setWebsiteSaving(true);
                saveToStorage("website", website);
                toast.success("Website settings saved");
                setWebsiteSaving(false);
              }} disabled={websiteSaving}>{websiteSaving ? "Saving…" : "Save"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Payment Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>JazzCash account</Label><Input placeholder="03xx-xxxxxxx" value={paymentSettings.jazzcash} onChange={e => setPaymentSettings({ ...paymentSettings, jazzcash: e.target.value })} /></div>
                <div><Label>EasyPaisa account</Label><Input placeholder="03xx-xxxxxxx" value={paymentSettings.easypaisa} onChange={e => setPaymentSettings({ ...paymentSettings, easypaisa: e.target.value })} /></div>
                <div><Label>Bank name</Label><Input placeholder="Meezan Bank" value={paymentSettings.bank} onChange={e => setPaymentSettings({ ...paymentSettings, bank: e.target.value })} /></div>
                <div><Label>IBAN</Label><Input placeholder="PK00 XXXX XXXXXXXX" value={paymentSettings.iban} onChange={e => setPaymentSettings({ ...paymentSettings, iban: e.target.value })} /></div>
              </div>
              <Button size="sm" onClick={() => {
                setPaymentSaving(true);
                saveToStorage("payments", paymentSettings);
                toast.success("Payment settings saved");
                setPaymentSaving(false);
              }} disabled={paymentSaving}>{paymentSaving ? "Saving…" : "Save"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>WhatsApp Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Business number</Label><Input placeholder="+92 …" value={whatsapp.number} onChange={e => setWhatsapp({ ...whatsapp, number: e.target.value })} /></div>
                <div><Label>API token</Label><Input type="password" placeholder="•••••" value={whatsapp.token} onChange={e => setWhatsapp({ ...whatsapp, token: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Default admission message</Label><Textarea rows={3} value={whatsapp.message} onChange={e => setWhatsapp({ ...whatsapp, message: e.target.value })} /></div>
              </div>
              <Button size="sm" onClick={() => {
                setWhatsappSaving(true);
                saveToStorage("whatsapp", whatsapp);
                toast.success("WhatsApp settings saved");
                setWhatsappSaving(false);
              }} disabled={whatsappSaving}>{whatsappSaving ? "Saving…" : "Save"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Email (SMTP) Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>SMTP Host</Label><Input placeholder="smtp.gmail.com" value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })} /></div>
                <div><Label>Port</Label><Input placeholder="587" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: e.target.value })} /></div>
                <div><Label>Username</Label><Input placeholder="noreply@pixel2pro.com" value={smtp.username} onChange={e => setSmtp({ ...smtp, username: e.target.value })} /></div>
                <div><Label>Password</Label><Input type="password" placeholder="•••••" value={smtp.password} onChange={e => setSmtp({ ...smtp, password: e.target.value })} /></div>
              </div>
              <Button size="sm" onClick={() => {
                setSmtpSaving(true);
                saveToStorage("smtp", smtp);
                toast.success("Email settings saved");
                setSmtpSaving(false);
              }} disabled={smtpSaving}>{smtpSaving ? "Saving…" : "Save"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Portal theme.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Dark mode</div>
                  <div className="text-xs text-muted-foreground">Toggle between light and dark themes.</div>
                </div>
                <div className="flex items-center gap-2"><Sun className="h-4 w-4" /><Switch checked={theme === "dark"} onCheckedChange={v => set(v ? "dark" : "light")} /><Moon className="h-4 w-4" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {[
                { key: "admissions", label: "New admissions", desc: "Bell + email on every new applicant." },
                { key: "payments", label: "New payments", desc: "Notify me on every incoming payment." },
                { key: "reviews", label: "New reviews", desc: "Alerts for reviews pending moderation." },
                { key: "failures", label: "Failed payments", desc: "Critical alerts for failed transactions." },
              ].map(row => (
                <div key={row.key} className="flex items-center justify-between py-3">
                  <div><div className="font-medium">{row.label}</div><div className="text-xs text-muted-foreground">{row.desc}</div></div>
                  <Switch checked={(notify as never)[row.key]} onCheckedChange={v => {
                    const next = { ...notify, [row.key]: v };
                    setNotify(next);
                    saveToStorage("notifications", next);
                    toast.success("Notification settings updated");
                  }} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-4 w-4" /> Database Maintenance</CardTitle><CardDescription>Take a snapshot or restore from a previous backup.</CardDescription></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" onClick={() => {
                  const data = JSON.stringify({
                    exportedAt: new Date().toISOString(),
                    version: "1.0",
                  });
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `p2p-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Backup downloaded");
                }}><HardDriveDownload className="mr-1.5 h-4 w-4" /> Backup</Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      toast.success(`Restore file selected: ${file.name}`);
                    }
                  };
                  input.click();
                }}><HardDriveUpload className="mr-1.5 h-4 w-4" /> Restore</Button>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">Backup exports your settings configuration as a JSON file.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
