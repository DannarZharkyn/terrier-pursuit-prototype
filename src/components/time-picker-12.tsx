"use client";

const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minutes = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

export function TimePicker12({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const parts = parseTime(value);

  function updateTime(next: Partial<{ hour: string; minute: string; period: "AM" | "PM" }>) {
    const hour = next.hour ?? parts.hour ?? "12";
    const minute = next.minute ?? parts.minute ?? "00";
    const period = next.period ?? parts.period ?? "AM";
    const hourNumber = Number(hour);
    const hour24 = period === "PM"
      ? hourNumber === 12 ? 12 : hourNumber + 12
      : hourNumber === 12 ? 0 : hourNumber;

    onChange(`${String(hour24).padStart(2, "0")}:${minute}`);
  }

  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(54px,1fr)_minmax(58px,1fr)_86px] gap-1.5">
      <select
        className="field min-h-10 min-w-0 px-2 py-2 text-sm"
        aria-label={`${label} hour`}
        value={parts.hour ?? ""}
        onChange={(event) => updateTime({ hour: event.target.value })}
      >
        <option value="" disabled>Hour</option>
        {hours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
      </select>
      <select
        className="field min-h-10 min-w-0 px-2 py-2 text-sm"
        aria-label={`${label} minute`}
        value={parts.minute ?? ""}
        onChange={(event) => updateTime({ minute: event.target.value })}
      >
        <option value="" disabled>Min</option>
        {minutes.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
      </select>
      <div className="grid min-w-0 grid-cols-2 overflow-hidden rounded-lg border border-gray-300 bg-white" aria-label={`${label} AM or PM`}>
        {(["AM", "PM"] as const).map((period) => (
          <button
            key={period}
            className={`min-h-10 px-1.5 text-xs font-bold transition ${
              parts.period === period
                ? "bg-bu-red text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            type="button"
            aria-pressed={parts.period === period}
            onClick={() => updateTime({ period })}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
}

function parseTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return {} as {
      hour?: string;
      minute?: string;
      period?: "AM" | "PM";
    };
  }

  const hour24 = Number(match[1]);
  return {
    hour: String(hour24 % 12 || 12),
    minute: match[2],
    period: (hour24 >= 12 ? "PM" : "AM") as "AM" | "PM",
  };
}
