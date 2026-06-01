"use client"

import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getSession, getUserProfile, updateUserProfile, uploadAvatar, type UserProfile } from "@/lib/storage"
import {
  User,
  Mail,
  Camera,
  Briefcase,
  MapPin,
  FileText,
  Save,
  Loader2,
  Upload,
  CheckCircle2
} from "lucide-react"

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [titleRole, setTitleRole] = useState("")
  const [department, setDepartment] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProfileData() {
      try {
        const session = await getSession()
        if (!session) {
          toast.error("You must be logged in to view this page")
          return
        }

        setUserId(session.userId)
        setEmail(session.email)

        // Load profile from database
        const userProfile = await getUserProfile(session.userId)
        if (userProfile) {
          setProfile(userProfile)
          setFullName(userProfile.full_name || "")
          setTitleRole(userProfile.title_role || "")
          setDepartment(userProfile.department || "")
          setBio(userProfile.bio || "")
          setAvatarUrl(userProfile.avatar_url || "")
        }
      } catch (err) {
        console.error("Failed to load user profile", err)
        toast.error("Failed to load profile details")
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  // Save profile edits
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    try {
      const updated = await updateUserProfile({
        id: userId,
        full_name: fullName.trim() || null,
        title_role: titleRole.trim() || null,
        department: department.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null
      })

      setProfile(updated)
      toast.success("Profile updated successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  // Handle file upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!userId || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 2MB.")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported.")
      return
    }

    setUploading(true)
    try {
      const publicUrl = await uploadAvatar(userId, file)
      setAvatarUrl(publicUrl)
      
      // Also update profiles table immediately so they don't have to hit "Save" for the photo
      await updateUserProfile({
        id: userId,
        avatar_url: publicUrl
      })

      toast.success("Profile picture uploaded successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to upload profile picture")
    } finally {
      setUploading(false)
    }
  }

  // Trigger file browser input click
  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  // Initial placeholder letters
  const nameInitials = fullName
    ? fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : email ? email[0].toUpperCase() : "U"

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading your profile...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
        
        {/* Page Header */}
        <div className="border-b pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage your personal credentials, department info, and profile avatar.
          </p>
        </div>

        {/* Profile Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Left Column: Profile Picture Card */}
          <Card className="border border-border/80 shadow-xs h-fit md:col-span-1">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              
              {/* Photo Area */}
              <div className="relative group size-32 rounded-full overflow-hidden border-2 border-primary/20 shadow-xs bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={fullName || "User avatar"}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-3xl font-extrabold text-primary bg-primary/10 size-full flex items-center justify-center">
                    {nameInitials}
                  </div>
                )}

                {/* Upload Overlay on Hover */}
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer disabled:pointer-events-none"
                >
                  <Camera className="h-5 w-5 mb-1 animate-pulse" />
                  Update Photo
                </button>

                {/* Loading indicator */}
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="text-center">
                <h3 className="font-bold text-base truncate max-w-[200px]">{fullName || "Anesthesiologist"}</h3>
                <p className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">{email}</p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={uploading}
                className="w-full gap-2 text-xs font-bold"
              >
                <Upload className="h-3.5 w-3.5" /> Upload Image
              </Button>
              <span className="text-[10px] text-muted-foreground block text-center">
                JPG, PNG or WEBP. Max 2MB.
              </span>
            </CardContent>
          </Card>

          {/* Right Column: Details Form Card */}
          <Card className="border border-border/80 shadow-xs md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Fill in your clinical details to personalize your contributions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                
                {/* Email Field (Disabled) */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5 font-bold text-xs">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted text-muted-foreground text-xs font-semibold"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Email address is tied to your credentials and cannot be changed.
                  </span>
                </div>

                {/* Full Name */}
                <div className="grid gap-2">
                  <Label htmlFor="fullName" className="flex items-center gap-1.5 font-bold text-xs">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Dr. Jane Doe, Sp.An"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-xs font-medium"
                    required
                  />
                </div>

                {/* Title / Role */}
                <div className="grid gap-2">
                  <Label htmlFor="titleRole" className="flex items-center gap-1.5 font-bold text-xs">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> Medical Title / Role
                  </Label>
                  <Input
                    id="titleRole"
                    placeholder="e.g. Senior Anesthesiology Resident"
                    value={titleRole}
                    onChange={(e) => setTitleRole(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>

                {/* Department */}
                <div className="grid gap-2">
                  <Label htmlFor="department" className="flex items-center gap-1.5 font-bold text-xs">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Clinical Department
                  </Label>
                  <Input
                    id="department"
                    placeholder="e.g. Department of Anesthesiology and Intensive Care"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>

                {/* Biography */}
                <div className="grid gap-2">
                  <Label htmlFor="bio" className="flex items-center gap-1.5 font-bold text-xs">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Professional Biography
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Describe your clinical focus, research interests, or hospital affiliation..."
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="text-xs font-medium resize-none leading-relaxed"
                  />
                </div>

                {/* Save Button */}
                <div className="border-t pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-2 bg-primary font-bold text-xs shadow-xs min-w-[120px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>

        </div>

      </div>
    </AppShell>
  )
}
