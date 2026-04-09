type ProfileMetadata = Record<string, unknown> | null | undefined;

function readString(metadata: ProfileMetadata, key: string) {
  if (!metadata) return "";
  const value = metadata[key];
  return typeof value === "string" ? value.trim() : "";
}

function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
}

export function getDisplayNameFromMetadata(metadata: ProfileMetadata, email?: string | null) {
  const firstName = readString(metadata, "first_name");
  const lastName = readString(metadata, "last_name");
  const fullName = readString(metadata, "full_name");
  const username = readString(metadata, "username");

  return fullName || buildFullName(firstName, lastName) || username || email?.split("@")[0] || "User";
}

export function getProfileFormState(metadata: ProfileMetadata) {
  const fullName = readString(metadata, "full_name");
  const firstName = readString(metadata, "first_name");
  const lastName = readString(metadata, "last_name");
  const username = readString(metadata, "username");
  const avatarUrl = readString(metadata, "avatar_url");

  const [derivedFirstName = "", ...derivedLastNameParts] = fullName.split(/\s+/).filter(Boolean);
  const derivedLastName = derivedLastNameParts.join(" ");

  return {
    firstName: firstName || derivedFirstName,
    lastName: lastName || derivedLastName,
    username,
    avatarUrl,
  };
}

export function buildProfileMetadata(profile: {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
}) {
  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();
  const username = profile.username.trim();
  const avatarUrl = profile.avatarUrl.trim();
  const fullName = buildFullName(firstName, lastName);

  return {
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    username: username || undefined,
    full_name: fullName || username || undefined,
    avatar_url: avatarUrl || undefined,
  };
}
