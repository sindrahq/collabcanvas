"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cropper, { type Area } from "react-easy-crop";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildProfileMetadata, getProfileFormState } from "@/lib/profile";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
};

async function createCroppedAvatarBlob(imageSrc: string, cropArea: Area, outputSize = 512): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not process selected image."));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize image canvas.");
  }

  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.save();
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    outputSize,
    outputSize
  );

  ctx.restore();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not generate cropped avatar."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [profile, setProfile] = useState<ProfileFormState>({
    firstName: "",
    lastName: "",
    username: "",
    avatarUrl: "",
  });

  useEffect(() => {
    return () => {
      if (cropImageUrl) {
        URL.revokeObjectURL(cropImageUrl);
      }
    };
  }, [cropImageUrl]);

  useEffect(() => {
    if (!supabase) {
      setError("Authentication is unavailable. Missing Supabase environment variables.");
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        router.replace("/auth?next=%2Fprofile");
        return;
      }

      setUserId(data.session.user.id);
      setEmail(data.session.user.email || "");
      setProfile(getProfileFormState(data.session.user.user_metadata));
      setLoading(false);
    });
  }, [router, supabase]);

  function closeCropModal() {
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
    }
    setCropImageUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    const maxBytes = 5 * 1024 * 1024;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > maxBytes) {
      setError("Avatar image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setCropImageUrl(nextUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    event.target.value = "";
  }

  async function handleConfirmAvatarCrop() {
    setError("");
    setMessage("");

    if (!supabase || !userId) {
      setError("Authentication is unavailable.");
      return;
    }

    if (!cropImageUrl || !croppedAreaPixels) {
      setError("Please adjust the crop area before saving.");
      return;
    }

    setUploadingAvatar(true);

    let croppedBlob: Blob;
    try {
      croppedBlob = await createCroppedAvatarBlob(cropImageUrl, croppedAreaPixels);
    } catch (cropError) {
      const cropMessage = cropError instanceof Error ? cropError.message : "Could not crop image.";
      setError(cropMessage);
      setUploadingAvatar(false);
      return;
    }

    const filePath = `${userId}/${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, croppedBlob, { upsert: true, cacheControl: "3600", contentType: "image/png" });

    if (uploadError) {
      setError(
        "Could not upload avatar. Ensure a public Supabase storage bucket named avatars exists and try again."
      );
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const nextAvatarUrl = urlData.publicUrl;

    const nextProfile = { ...profile, avatarUrl: nextAvatarUrl };
    const { error: updateError } = await supabase.auth.updateUser({
      data: buildProfileMetadata(nextProfile),
    });

    if (updateError) {
      setError(updateError.message);
      setUploadingAvatar(false);
      return;
    }

    setProfile(nextProfile);
    setMessage("Avatar uploaded successfully.");
    setUploadingAvatar(false);
    closeCropModal();
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Authentication is unavailable.");
      setSaving(false);
      return;
    }

    if (!userId) {
      setError("You must be signed in to update your profile.");
      setSaving(false);
      return;
    }

    const normalizedUsername = profile.username.trim().toLowerCase();
    if (normalizedUsername && !/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      setError("Username must be 3-30 chars and only contain letters, numbers, or underscores.");
      setSaving(false);
      return;
    }

    if (normalizedUsername) {
      const { error: usernameDirectoryError } = await supabase.from("user_profiles").upsert(
        {
          user_id: userId,
          username: normalizedUsername,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (usernameDirectoryError) {
        if (usernameDirectoryError.code === "23505") {
          setError("That username is already taken. Please choose another username.");
          setSaving(false);
          return;
        }

        if (usernameDirectoryError.message.includes("Could not find the table 'public.user_profiles'")) {
          setError("Username directory is missing. Run docs/SUPABASE_USERNAMES_SETUP.sql in Supabase SQL Editor.");
          setSaving(false);
          return;
        }

        setError(usernameDirectoryError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: removeUsernameError } = await supabase
        .from("user_profiles")
        .delete()
        .eq("user_id", userId);

      if (removeUsernameError && !removeUsernameError.message.includes("Could not find the table 'public.user_profiles'")) {
        setError(removeUsernameError.message);
        setSaving(false);
        return;
      }
    }

    const nextProfile = {
      ...profile,
      username: normalizedUsername,
    };

    const { error: updateError } = await supabase.auth.updateUser({
      data: buildProfileMetadata(nextProfile),
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfile(nextProfile);
      setMessage("Profile updated successfully.");
    }

    setSaving(false);
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Authentication is unavailable.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated successfully.");
      setPassword("");
    }

    setSaving(false);
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] px-6 py-12 text-[#1a1a1a]">
        <p className="mx-auto max-w-3xl text-sm text-[#6a6257]">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-6 py-12 text-[#1a1a1a]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/projects" className="text-sm text-[#6a6257] hover:text-[#1a1a1a]">
            Back to projects
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-lg border border-[#d7cec2] bg-white px-3 py-2 text-sm hover:bg-[#f2ece4]"
          >
            Log out
          </button>
        </div>

        <h1 className="mb-1 text-3xl font-semibold tracking-tight">Your profile</h1>
        <p className="mb-6 text-sm text-[#6a6257]">Manage your account details and security settings.</p>

        <section className="mb-4 rounded-2xl border border-[#dfd7cd] bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
          <p className="mb-4 text-sm text-[#6a6257]">Signed in as {email || "-"}</p>

          <div className="mb-4 rounded-xl border border-[#e5dccf] bg-[#fbf8f3] p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[#6a6257]">Avatar</p>
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={profile.avatarUrl || "/account.png"}
                alt="Avatar preview"
                className="h-14 w-14 rounded-full border border-[#d8cfc3] object-cover"
              />
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#d7cec2] bg-white px-3 py-2 text-sm text-[#3f372e] transition hover:bg-[#f5f1eb]">
                {uploadingAvatar ? "Uploading..." : "Upload photo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={(event) => void handleAvatarUpload(event)}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
              {profile.avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setProfile((prev) => ({ ...prev, avatarUrl: "" }))}
                  className="rounded-lg border border-[#d7cec2] bg-white px-3 py-2 text-sm text-[#3f372e] transition hover:bg-[#f5f1eb]"
                >
                  Remove avatar
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-[#7a7268]">PNG, JPG, WEBP or GIF up to 5MB.</p>
          </div>

          <form className="space-y-3" onSubmit={(event) => void handleSaveProfile(event)}>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={profile.firstName}
                onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
                placeholder="First name"
                className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
              />
              <input
                type="text"
                value={profile.lastName}
                onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
                placeholder="Surname"
                className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
              />
            </div>
            <input
              type="text"
              value={profile.username}
              onChange={(event) => setProfile((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="Username"
              autoComplete="username"
              className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#2c2c2c] disabled:opacity-70"
            >
              Save profile
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#dfd7cd] bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
          <h2 className="mb-3 text-lg font-medium">Change password</h2>
          <form className="space-y-3" onSubmit={(event) => void handleChangePassword(event)}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              placeholder="New password"
              className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#2c2c2c] disabled:opacity-70"
            >
              Update password
            </button>
          </form>
        </section>

        {error ? <p className="mt-4 text-sm text-[#b43f3f]">{error}</p> : null}
        {!error && message ? <p className="mt-4 text-sm text-[#2f6f4f]">{message}</p> : null}
      </div>

      {cropImageUrl ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-[rgba(17,14,11,0.6)] p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#d7cec2] bg-white p-4 shadow-[0_28px_50px_rgba(0,0,0,0.28)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Crop avatar</h2>
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-lg border border-[#ddd4c9] px-2 py-1 text-xs text-[#5f584e] hover:bg-[#f5f1eb]"
              >
                Cancel
              </button>
            </div>

            <div className="relative h-72 overflow-hidden rounded-xl bg-[#181512]">
              <Cropper
                image={cropImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_croppedArea, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.08em] text-[#6a6257]">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-lg border border-[#d7cec2] bg-white px-3 py-2 text-sm text-[#3f372e] hover:bg-[#f5f1eb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmAvatarCrop()}
                disabled={uploadingAvatar}
                className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-white hover:bg-[#2c2c2c] disabled:opacity-70"
              >
                {uploadingAvatar ? "Saving..." : "Save avatar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
