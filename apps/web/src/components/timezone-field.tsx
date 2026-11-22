import { defaultTimezone } from "@/lib/profile";
import { fieldClass, labelClass } from "@/lib/ui";

const timezones = Intl.supportedValuesOf("timeZone");

export function TimezoneField({
  defaultValue = defaultTimezone,
}: {
  defaultValue?: string;
}) {
  return (
    <label className={`${labelClass} mt-4`}>
      Reporting timezone
      <input
        className={fieldClass}
        name="timezone"
        list="timezone-options"
        defaultValue={defaultValue}
        placeholder={defaultTimezone}
        autoComplete="off"
        required
      />
      <datalist id="timezone-options">
        {timezones.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
    </label>
  );
}
