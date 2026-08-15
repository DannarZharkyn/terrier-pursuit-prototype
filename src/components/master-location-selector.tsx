"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { MasterLocation } from "@/lib/master-locations";

export function MasterLocationSelector({
  locations,
  selectedIds,
  onChange,
  disabled = false,
}: {
  locations: MasterLocation[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? locations.filter((location) =>
          `${location.landmark} ${location.campusPopulation}`.toLowerCase().includes(normalized),
        )
      : locations;
  }, [locations, query]);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-950">Master Location List</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Check every location you want in this game. You can still upload a spreadsheet below.
          </p>
        </div>
        <p className="shrink-0 text-sm font-black text-bu-red">
          {selectedIds.length} selected
        </p>
      </div>
      <label className="relative mt-4 block">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          className="field pl-10"
          placeholder="Search locations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
        {filtered.length ? filtered.map((location) => (
          <label
            key={location.id}
            className={`flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition ${disabled ? "cursor-not-allowed opacity-65" : "cursor-pointer hover:border-bu-red"}`}
          >
            <input
              className="mt-1 h-5 w-5 shrink-0 accent-red-600"
              type="checkbox"
              checked={selectedIds.includes(location.id)}
              disabled={disabled}
              onChange={() => toggle(location.id)}
            />
            <span>
              <span className="block font-bold text-gray-950">{location.landmark}</span>
              <span className="mt-1 block text-xs leading-5 text-gray-600">{location.clue}</span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {location.campusPopulation}
              </span>
            </span>
          </label>
        )) : (
          <p className="rounded-lg bg-white p-4 text-sm text-gray-600">
            No matching locations found.
          </p>
        )}
      </div>
    </section>
  );
}
