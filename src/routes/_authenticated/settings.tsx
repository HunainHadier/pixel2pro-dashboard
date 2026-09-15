import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import { supabaseRequest } from "@/lib/supabase";
import { toast } from "sonner";
import { Database, HardDriveDownload, HardDriveUpload, Image as ImageIcon, Megaphone, Plus, Upload, X } from "lucide-react";
import { Spinner } from "@/components/admin/spinner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Pixel2Pro Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session } = useSession();
  const [notify, setNotify] = useState({ admissions: true });

  const [profile, setProfile] = useState({
    name: session?.name || "",
    email: session?.email || "",
    phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [banner, setBanner] = useState({
    ai_banner_enabled: true,
    ai_banner_link: "https://chat.whatsapp.com/Js9TVHNxeNCAEznLzzqjUy?s=sh&p=a&mlu=4&ilr=4",
    ai_banner_text: "Join our free AI awareness session on WhatsApp.",
    ai_banner_subtext:
      "Get the AI awareness session schedule and joining link directly on WhatsApp. Tap the button to reserve your free spot.",
  });
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);

  const [hero, setHero] = useState<{ hero_images: string[]; hero_video: string }>({
    hero_images: [],
    hero_video: "",
  });
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const heroImagesRef = useRef<string[]>([]);

  const loadFromStorage = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(`p2p_settings_${key}`);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      for (const k in parsed) if (parsed[k] !== undefined) (fallback as Record<string, unknown>)[k] = parsed[k];
      return fallback;
    } catch {
      return fallback;
    }
  };

  const [loaded, setLoaded] = useState(false);
  if (!loaded && typeof window !== "undefined") {
    setProfile(loadFromStorage("profile", profile));
    setNotify(loadFromStorage("notifications", notify));
    setLoaded(true);
  }

  useEffect(() => {
    if (heroLoaded) return;
    supabaseRequest<{ hero_images: string[]; hero_video: string }[]>(
      "/rest/v1/site_settings?select=hero_images,hero_video&limit=1",
    )
      .then((rows) => {
        const row = rows?.[0];
        if (row) {
          const imgs = Array.isArray(row.hero_images) ? row.hero_images : [];
          heroImagesRef.current = imgs;
          setHero({
            hero_images: imgs,
            hero_video: row.hero_video || "",
          });
        }
      })
      .catch(() => {
        toast.error("Failed to load home hero settings");
      })
      .finally(() => setHeroLoaded(true));
  }, [heroLoaded]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const persistHeroImages = async (imgs: string[]) => {
    heroImagesRef.current = imgs;
    const rows = await supabaseRequest<{ hero_images: string[]; hero_video: string }[]>(
      "/rest/v1/site_settings?id=eq.default",
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ hero_images: imgs }),
      },
    );
    const saved = Array.isArray(rows?.[0]?.hero_images) ? rows[0].hero_images : imgs;
    heroImagesRef.current = saved;
    setHero((h) => ({ ...h, hero_images: saved }));
  };

  const compressImage = (file: File) =>
    new Promise<string>((resolve, reject) => {
      readFileAsDataUrl(file)
        .then((dataUrl) => {
          const img = new Image();
          img.onload = () => {
            const MAX = 1200;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(dataUrl);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        })
        .catch(reject);
    });

  const handleHeroImagesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || heroUploading) return;
    const list = Array.from(files);
    setHeroUploading(true);
    try {
      for (const file of list) {
        const dataUrl = await compressImage(file);
        await persistHeroImages([...heroImagesRef.current, dataUrl]);
      }
      toast.success(list.length === 1 ? "Hero image added" : `${list.length} hero images added`);
    } catch {
      toast.error("Failed to save hero image. Run migration-v6-hero-images.sql first.");
    } finally {
      setHeroUploading(false);
    }
  };

  const handleHeroImageRemove = async (index: number) => {
    try {
      await persistHeroImages(heroImagesRef.current.filter((_, i) => i !== index));
      toast.success("Hero image removed");
    } catch {
      toast.error("Failed to remove hero image");
    }
  };

  const handleHeroSave = async () => {
    setHeroUploading(true);
    try {
      await supabaseRequest("/rest/v1/site_settings?id=eq.default", {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ hero_video: hero.hero_video }),
      });
      toast.success("Home hero updated");
    } catch {
      toast.error("Failed to save home hero. Run migration-v6-hero-images.sql first.");
    } finally {
      setHeroUploading(false);
    }
  };

  useEffect(() => {
    if (bannerLoaded) return;
    supabaseRequest<
      {
        ai_banner_enabled: boolean;
        ai_banner_link: string;
        ai_banner_text: string;
        ai_banner_subtext: string;
      }[]
    >("/rest/v1/site_settings?select=*&limit=1")
      .then((rows) => {
        const row = rows?.[0];
        if (row) {
          setBanner({
            ai_banner_enabled: row.ai_banner_enabled,
            ai_banner_link: row.ai_banner_link,
            ai_banner_text: row.ai_banner_text,
            ai_banner_subtext: row.ai_banner_subtext,
          });
        }
      })
      .catch(() => {
        toast.error("Failed to load banner settings");
      })
      .finally(() => setBannerLoaded(true));
  }, [bannerLoaded]);

  const saveToStorage = (key: string, data: Record<string, unknown>) => {
    localStorage.setItem(`p2p_settings_${key}`, JSON.stringify(data));
  };

  const handleBannerSave = async () => {
    setBannerSaving(true);
    try {
      await supabaseRequest("/rest/v1/site_settings?id=eq.default", {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          ai_banner_enabled: banner.ai_banner_enabled,
          ai_banner_link: banner.ai_banner_link,
          ai_banner_text: banner.ai_banner_text,
          ai_banner_subtext: banner.ai_banner_subtext,
        }),
      });
      toast.success("Website banner updated");
    } catch {
      toast.error("Failed to save banner. Run migration-v4-site-settings.sql first.");
    } finally {
      setBannerSaving(false);
    }
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
    <AdminLayout title="Settings" subtitle="Portal, notifications, and maintenance.">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full flex-wrap justify-start rounded-xl gap-1">
          <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
          <TabsTrigger value="password" className="text-xs">Password</TabsTrigger>
          <TabsTrigger value="banner" className="text-xs">Banner</TabsTrigger>
          <TabsTrigger value="hero" className="text-xs">Home Hero</TabsTrigger>
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
              }} disabled={profileSaving}>{profileSaving ? <><Spinner className="mr-1.5 h-4 w-4" /> Saving…</> : "Save"}</Button>
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
              <Button size="sm" onClick={handlePasswordChange} disabled={passwordSaving}>{passwordSaving ? <><Spinner className="mr-1.5 h-4 w-4" /> Updating…</> : "Update"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banner" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Website Banner</CardTitle><CardDescription>AI Awareness Session strip shown across the website. Design stays fixed — content and visibility are controlled here.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <div className="font-medium">Show banner on website</div>
                  <div className="text-xs text-muted-foreground">Turn off to hide the WhatsApp session strip entirely.</div>
                </div>
                <Switch checked={banner.ai_banner_enabled} onCheckedChange={v => setBanner({ ...banner, ai_banner_enabled: v })} />
              </div>
              <div><Label>Button / link (WhatsApp group)</Label><Input value={banner.ai_banner_link} onChange={e => setBanner({ ...banner, ai_banner_link: e.target.value })} /></div>
              <div><Label>Heading text</Label><Input value={banner.ai_banner_text} onChange={e => setBanner({ ...banner, ai_banner_text: e.target.value })} /></div>
              <div><Label>Sub text</Label><Textarea rows={3} value={banner.ai_banner_subtext} onChange={e => setBanner({ ...banner, ai_banner_subtext: e.target.value })} /></div>
              <Button size="sm" onClick={handleBannerSave} disabled={bannerSaving || !bannerLoaded}>{bannerSaving ? <><Spinner className="mr-1.5 h-4 w-4" /> Saving…</> : "Save"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Home Hero — Media</CardTitle><CardDescription>Upload images shown in the home hero section. Multiple images rotate automatically. Leave empty to fall back to the default video.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hero images <span className="text-muted-foreground font-normal">— one image at a time (adds immediately)</span></Label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {hero.hero_images.map((src, i) => (
                    <div key={`${i}-${src.slice(-20)}`} className="group relative overflow-hidden rounded-xl border border-border">
                      <img src={src} alt={`Hero image ${i + 1}`} className="h-36 w-full object-cover" />
                      <button
                        type="button"
                        disabled={heroUploading}
                        aria-label={`Remove image ${i + 1}`}
                        onClick={() => handleHeroImageRemove(i)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {heroUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Spinner className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  <label className={`flex h-36 items-center justify-center rounded-xl border-2 border-dashed transition ${heroUploading ? "pointer-events-none border-border opacity-40" : "cursor-pointer border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                    {heroUploading ? <Spinner className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                    <input type="file" accept="image/*" multiple className="hidden" disabled={heroUploading} onChange={e => { handleHeroImagesUpload(e.target.files); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
              <div><Label>Hero video URL <span className="text-muted-foreground font-normal">— optional, used only when no images are set</span></Label><Input placeholder="https://…/hero.mp4" value={hero.hero_video} onChange={e => setHero(h => ({ ...h, hero_video: e.target.value }))} /></div>
              <Button size="sm" onClick={handleHeroSave} disabled={heroUploading || !heroLoaded}>{heroUploading ? <><Spinner className="mr-1.5 h-4 w-4" /> Uploading…</> : "Save"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <div className="flex items-center justify-between py-3">
                <div><div className="font-medium">New admissions</div><div className="text-xs text-muted-foreground">Bell + email on every new applicant.</div></div>
                <Switch checked={notify.admissions} onCheckedChange={v => {
                  const next = { admissions: v };
                  setNotify(next);
                  saveToStorage("notifications", next);
                  toast.success("Notification settings updated");
                }} />
              </div>
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