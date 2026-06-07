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
import { createClient } from "@/lib/supabase/client"
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
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Link2,
  Trash2,
  ShieldAlert,
  QrCode,
  Laptop
} from "lucide-react"

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Tab control state
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile")

  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [titleRole, setTitleRole] = useState("")
  const [department, setDepartment] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  // Security Management state
  const [newEmail, setNewEmail] = useState("")
  const [updatingEmail, setUpdatingEmail] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // MFA state
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaFactors, setMfaFactors] = useState<any[]>([])
  const [enrollingMfa, setEnrollingMfa] = useState(false)
  const [mfaSecret, setMfaSecret] = useState("")
  const [mfaQrCode, setMfaQrCode] = useState("")
  const [mfaFactorId, setMfaFactorId] = useState("")
  const [mfaOtp, setMfaOtp] = useState("")
  const [verifyingMfa, setVerifyingMfa] = useState(false)

  // Identities state (OAuth providers)
  const [identities, setIdentities] = useState<any[]>([])

  // Recovery session state
  const [isRecoverySession, setIsRecoverySession] = useState(false)

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

        // Load security details
        const supabase = createClient()
        
        // Load identities
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.identities) {
          setIdentities(user.identities)
        }

        // Load MFA factors
        const { data: mfaData, error: mfaError } = await supabase.auth.mfa.listFactors()
        if (!mfaError && mfaData) {
          setMfaFactors(mfaData.all || [])
        }

        // Automatically switch to security tab if recovery or security tab requested
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search)
          if (searchParams.get("tab") === "security" || searchParams.get("recovery") === "true") {
            setActiveTab("security")
          }
        }

        // Check if current session is recovery
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          try {
            const parts = currentSession.access_token.split(".")
            if (parts.length === 3) {
              const base64Url = parts[1]
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              )
              const payload = JSON.parse(jsonPayload)
              const amr = payload.amr
              if (Array.isArray(amr)) {
                const methods = amr.map((item: any) => {
                  if (typeof item === "string") return item
                  if (item && typeof item === "object" && typeof item.method === "string") {
                    return item.method
                  }
                  return ""
                }).filter(Boolean)
                if (methods.includes("recovery")) {
                  setIsRecoverySession(true)
                }
              }
            }
          } catch (e) {
            console.error("Error parsing recovery AMR in profile:", e)
          }
        }
      } catch (err) {
        console.error("Failed to load user profile & security details", err)
        toast.error("Failed to load profile details")
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  // Refreshes MFA factors list
  async function refreshMfaFactors() {
    setMfaLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (!error && data) {
        setMfaFactors(data.all || [])
      }
    } catch (err) {
      console.error("MFA list error:", err)
    } finally {
      setMfaLoading(false)
    }
  }

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

  // Update email address
  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) {
      toast.error("Please enter a valid email address")
      return
    }

    setUpdatingEmail(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Verification link sent! Please confirm the change in your new email.")
        setNewEmail("")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update email")
    } finally {
      setUpdatingEmail(false)
    }
  }

  // Update password
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setUpdatingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Password updated successfully")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update password")
    } finally {
      setUpdatingPassword(false)
    }
  }

  // Enroll MFA Factor
  async function handleStartMfaEnroll() {
    setMfaLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "AnesthesiApp",
        friendlyName: email
      })

      if (error) {
        toast.error(error.message)
      } else if (data) {
        setMfaFactorId(data.id)
        setMfaSecret(data.totp.secret)
        setMfaQrCode(data.totp.qr_code)
        setEnrollingMfa(true)
      }
    } catch (err: any) {
      toast.error(err.message || "MFA enrollment failed")
    } finally {
      setMfaLoading(false)
    }
  }

  // Verify and activate MFA factor
  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault()
    if (mfaOtp.length < 6) {
      toast.error("Please enter the 6-digit confirmation code")
      return
    }

    setVerifyingMfa(true)
    try {
      const supabase = createClient()
      
      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId
      })

      if (challengeError) {
        toast.error(challengeError.message)
        setVerifyingMfa(false)
        return
      }

      // Verify the challenge
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaOtp.trim()
      })

      if (verifyError) {
        toast.error(verifyError.message)
      } else {
        // Update user metadata to reflect MFA is enabled
        await supabase.auth.updateUser({ data: { mfa_enrolled: true } })
        toast.success("MFA successfully enabled!")
        setEnrollingMfa(false)
        setMfaOtp("")
        setMfaSecret("")
        setMfaQrCode("")
        setMfaFactorId("")
        await refreshMfaFactors()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify MFA OTP")
    } finally {
      setVerifyingMfa(false)
    }
  }

  // Disable MFA Factor
  async function handleDisableMfa(factorId: string) {
    if (!confirm("Are you sure you want to disable Multi-Factor Authentication? This decreases account security.")) {
      return
    }

    setMfaLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      })

      if (error) {
        toast.error(error.message)
      } else {
        // Update user metadata to reflect MFA is disabled
        await supabase.auth.updateUser({ data: { mfa_enrolled: false } })
        toast.success("MFA successfully disabled")
        await refreshMfaFactors()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to disable MFA")
    } finally {
      setMfaLoading(false)
    }
  }

  // Reset MFA factors using recovery-bypassed database RPC function
  async function handleResetMfa() {
    if (!confirm("Are you sure you want to reset your Two-Factor Authentication? This will delete all active authenticator factors.")) {
      return
    }

    setMfaLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc("reset_user_mfa")
      if (error) {
        toast.error(error.message)
      } else {
        // Refresh session to get a new JWT token reflecting the updated metadata
        await supabase.auth.refreshSession()
        toast.success("MFA factors successfully reset!")
        await refreshMfaFactors()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset MFA factors")
    } finally {
      setMfaLoading(false)
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
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage your personal profile details, security settings, and connected integrations.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border gap-6 text-sm font-semibold mb-2">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Profile Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "security"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Account Security
          </button>
        </div>

        {activeTab === "profile" ? (
          /* ================================================================= */
          /* PROFILE DETAILS TAB                                               */
          /* ================================================================= */
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
                  
                  {/* Email Field (ReadOnly in Profile tab) */}
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
                      Email address can be changed under the Account Security tab.
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
        ) : (
          /* ================================================================= */
          /* ACCOUNT SECURITY TAB                                              */
          /* ================================================================= */
          <>
            {isRecoverySession && (
              <div className="mb-6 flex items-start gap-3 p-4 border border-amber-200 bg-amber-500/5 rounded-lg text-amber-800 dark:text-amber-300">
                <ShieldAlert className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs">Recovery Session Active</h4>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    You logged in using a password recovery link. If you lost your 2FA authenticator device, you can reset it below to regain normal access. We also highly recommend updating your passphrase to a secure password.
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid gap-6 md:grid-cols-3">
            
            {/* Left Side: Overview & Linked Accounts */}
            <div className="flex flex-col gap-6 md:col-span-1">
              
              {/* Security Overview */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Security Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Verified Email</h4>
                      <p className="text-[10px] text-muted-foreground font-medium">Your login identity is confirmed.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${mfaFactors.length > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Multi-Factor Auth</h4>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {mfaFactors.length > 0 ? "2FA Protection is active" : "Account is vulnerable (2FA disabled)"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Linked OAuth Accounts */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="h-4 w-4" /> Connected Accounts
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Social accounts connected to your profile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {identities.length > 0 ? (
                    identities.map((identity) => (
                      <div key={identity.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          {identity.provider === "google" ? (
                            <svg className="h-4 w-4 text-foreground" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                          ) : (
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-xs font-bold text-foreground capitalize">{identity.provider}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 rounded-full px-2 py-0.5 font-bold">Connected</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No social connections found.</p>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Side: Security Management Forms */}
            <div className="flex flex-col gap-6 md:col-span-2">
              
              {/* Change Email Form */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-primary" /> Update Email Address
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Initiates a secure request to update your registered email identity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="currentEmail" className="text-xs font-bold text-muted-foreground">Current Email Address</Label>
                      <Input
                        id="currentEmail"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted text-muted-foreground text-xs font-medium"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="newEmail" className="text-xs font-bold text-foreground">New Email Address</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="new.email@hospital.org"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="text-xs font-medium"
                        required
                        disabled={updatingEmail}
                      />
                    </div>

                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        type="submit"
                        disabled={updatingEmail}
                        className="bg-primary font-bold text-xs shadow-xs min-w-[120px]"
                      >
                        {updatingEmail ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                          </>
                        ) : (
                          "Request Email Update"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Change Password Form */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-primary" /> Update Passphrase
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose a strong, unique password to secure your case logger database.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword" className="text-xs font-bold text-foreground">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="text-xs font-medium"
                        required
                        disabled={updatingPassword}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword" className="text-xs font-bold text-foreground">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="text-xs font-medium"
                        required
                        disabled={updatingPassword}
                      />
                    </div>

                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        type="submit"
                        disabled={updatingPassword}
                        className="bg-primary font-bold text-xs shadow-xs min-w-[120px]"
                      >
                        {updatingPassword ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Multi-Factor Authentication (MFA) */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Two-Factor Authentication (2FA)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Verify logins with a temporary 6-digit passcode from an authenticator app (like Google Authenticator).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mfaLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : enrollingMfa ? (
                    /* MFA Enrollment Wizard */
                    <form onSubmit={handleVerifyMfa} className="space-y-4 p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                          <h4 className="font-bold text-xs">1. Link Authenticator App</h4>
                          <p className="text-[10px] text-muted-foreground leading-normal">
                            Scan this QR code with your authenticator app, or manually copy-paste the secret key below:
                          </p>
                          <div className="p-2 border rounded bg-background w-fit select-all font-mono text-[10px] break-all">
                            {mfaSecret}
                          </div>
                        </div>
                        {/* Display SVG QR code if present */}
                        {mfaQrCode && (
                          <div className="bg-white p-2 border rounded shadow-xs w-28 h-28 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={
                                mfaQrCode.startsWith("<svg")
                                  ? `data:image/svg+xml;utf-8,${encodeURIComponent(mfaQrCode)}`
                                  : mfaQrCode.startsWith("data:image/svg+xml;utf-8,")
                                    ? `data:image/svg+xml;utf-8,${encodeURIComponent(mfaQrCode.substring("data:image/svg+xml;utf-8,".length))}`
                                    : mfaQrCode
                              } 
                              alt="MFA QR Code" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-bold text-xs mb-2">2. Enter verification code</h4>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="mfaOtp" className="text-[10px] font-bold text-muted-foreground uppercase">6-digit Code</Label>
                          <div className="flex gap-3">
                            <Input
                              id="mfaOtp"
                              type="text"
                              maxLength={6}
                              placeholder="123456"
                              value={mfaOtp}
                              onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              className="text-center font-mono text-lg tracking-wider max-w-[150px]"
                              disabled={verifyingMfa}
                              required
                            />
                            <Button
                              type="submit"
                              disabled={verifyingMfa}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                              {verifyingMfa ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Enable"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setEnrollingMfa(false)}
                              disabled={verifyingMfa}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : mfaFactors.length > 0 ? (
                    /* MFA Active State */
                    <div className="space-y-4">
                      {mfaFactors.map((factor) => (
                        <div key={factor.id} className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-500/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                              <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-foreground">TOTP Authenticator Active</h4>
                              <p className="text-[10px] text-muted-foreground">Added on {new Date(factor.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {isRecoverySession ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleResetMfa}
                              className="font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white border-none"
                            >
                              Reset 2FA/MFA
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDisableMfa(factor.id)}
                              className="font-bold text-xs"
                            >
                              Disable 2FA
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* MFA Disabled State */
                    <div className="flex flex-col gap-4 items-center justify-center py-6 text-center p-4 border border-dashed rounded-lg bg-muted/20">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                        <ShieldAlert className="h-6 w-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-foreground">MFA is Currently Disabled</h4>
                        <p className="text-[10px] text-muted-foreground leading-normal max-w-sm">
                          Protect your patients' private clinical case files with a secondary dynamic authentication code.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleStartMfaEnroll}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                      >
                        Set up Two-Factor Authentication
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>
          </>
        )}

      </div>
    </AppShell>
  )
}
