export const examTracks = ["MDCAT", "Other"] as const;
export type ExamTrack = (typeof examTracks)[number];

export const defaultTimezone = "Asia/Karachi";
export const minExamYear = 2020;
export const maxExamYear = 2045;

export type Profile = {
  full_name: string;
  username: string;
  exam_track: ExamTrack;
  daily_target_minutes: number;
  exam_year: number;
  timezone: string;
};

export function parseProfile(form: FormData): Profile | string {
  const fullName = String(form.get("full_name") ?? "").trim();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const examTrack = String(form.get("exam_track") ?? "");
  const target = Number(form.get("daily_target_minutes"));
  const examYear = Number(form.get("exam_year") ?? new Date().getFullYear());
  const timezone = String(form.get("timezone") ?? defaultTimezone).trim();

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
  if (
    !Number.isInteger(examYear) ||
    examYear < minExamYear ||
    examYear > maxExamYear
  ) {
    return `Choose an exam year between ${minExamYear} and ${maxExamYear}.`;
  }
  if (!isTimezone(timezone)) {
    return "Choose a valid reporting timezone.";
  }

  return {
    full_name: fullName,
    username,
    exam_track: examTrack,
    daily_target_minutes: target,
    exam_year: examYear,
    timezone,
  };
}

function isTimezone(value: string) {
  if (!value) return false;

  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
