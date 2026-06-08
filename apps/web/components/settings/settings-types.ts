import type { AiSettings } from "@/lib/ai-settings-api";
import type { MeStatus } from "@/lib/me-api";
import type { SetupStatus } from "@/lib/setup-api";
import type { ManagedUser } from "@/lib/user-api";

export type SettingsSectionId = "profile" | "data" | "ai" | "members" | "instance";

export type SettingsContext = {
  aiSettings: AiSettings | null;
  loading: boolean;
  managedUsers: ManagedUser[];
  me: MeStatus | null;
  setAiSettings: (settings: AiSettings) => void;
  setManagedUsers: (users: ManagedUser[]) => void;
  setMe: (me: MeStatus) => void;
  setStatus: (status: SetupStatus) => void;
  status: SetupStatus | null;
};
