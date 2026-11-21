export const examTracks = ["MDCAT", "Other"] as const;
export type ExamTrack = (typeof examTracks)[number];
export type Profile = {
  full_name: string;
  username: string;
  exam_track: ExamTrack;
  daily_target_minutes: number;
};

export function parseProfile(form: FormData): Profile | string {
  const fullName = String(form.get("full_name") ?? "").trim();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const examTrack = String(form.get("exam_track") ?? "");
  const target = Number(form.get("daily_target_minutes"));

  if (fullName.length < 2 || fullName.length > 80) {
    return "Enter a name between 2 and 80 characters.";
  }
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return "Use 3–24 letters, numbers or underscores in your username.";
  }
  if (examTrack !== "MDCAT" && examTrack !== "Other") {
    return "Choose an exam track.";
  }
  if (!Number.isInteger(target) || target < 15 || target > 720) {
    return "Enter a daily goal between 15 and 720 minutes.";
  }

  return {
    full_name: fullName,
    username,
    exam_track: examTrack,
    daily_target_minutes: target,
  };
}
