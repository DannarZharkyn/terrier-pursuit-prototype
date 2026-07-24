import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";
import { parseEventLocationImportFile } from "./event-locations";

describe("parseEventLocationImportFile", () => {
  it("parses valid location rows and generates positions", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Landmark", "Location", "Clue", "Campus Population"],
        [
          "  Leif   Erikson Statue ",
          "https://goo.gl/maps/Fkjt8GsoETJVQV5SA",
          "Find the Viking explorer.",
          "CRC",
        ],
        [
          "BU Bridge",
          "https://maps.app.goo.gl/KNCoZhgUejXZHUgw9",
          "Find the layered bridge.",
          "CRC",
        ],
      ]),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.deepEqual(result.summary, {
      totalRows: 2,
      importedRows: 2,
      blankRows: 0,
    });
    assert.deepEqual(result.locations[0], {
      rowNumber: 2,
      position: 1,
      landmark: "Leif Erikson Statue",
      normalizedLandmark: "leif erikson statue",
      locationUrl: "https://goo.gl/maps/Fkjt8GsoETJVQV5SA",
      clue: "Find the Viking explorer.",
      campusPopulation: "CRC",
    });
    assert.equal(result.locations[1].position, 2);
  });

  it("allows extra columns and ignores them", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Clue", "Internal Notes", "Campus Population", "Landmark", "Location"],
        [
          "Find the statue.",
          "Do not import this",
          "CRC",
          "Bill Russell Statue",
          "https://goo.gl/maps/vus8dphsevFc1bVEA",
        ],
      ]),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.locations[0].landmark, "Bill Russell Statue");
    assert.equal(result.locations[0].position, 1);
  });

  it("ignores fully blank rows and keeps positions based on nonblank rows", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Landmark", "Location", "Clue", "Campus Population"],
        ["Hood Milk Bottle", "https://goo.gl/maps/SxNaD8yJJfRaAM7S9", "Find the bottle.", "CRC"],
        ["", "", "", ""],
        ["Skinny House", "https://goo.gl/maps/Db7Dn7J5tN58obZy6", "Find the skinny house.", "CRC"],
      ]),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.deepEqual(result.summary, {
      totalRows: 3,
      importedRows: 2,
      blankRows: 1,
    });
    assert.deepEqual(
      result.locations.map((location) => location.position),
      [1, 2],
    );
  });

  it("returns row-level errors for missing required values", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Landmark", "Location", "Clue", "Campus Population"],
        ["", "https://example.com/a", "Find it.", "CRC"],
        ["Old North Church", "", "Find it.", "CRC"],
        ["Omni Parker House", "https://example.com/b", "", "CRC"],
        ["BU Bridge", "https://example.com/c", "Find it.", ""],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.deepEqual(
      result.errors.map((error) => error.message),
      [
        "Row 2: Landmark is required.",
        "Row 3: Location is required.",
        "Row 4: Clue is required.",
        "Row 5: Campus Population is required.",
      ],
    );
  });

  it("returns an error for invalid location urls", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Landmark", "Location", "Clue", "Campus Population"],
        ["Harvard Bridge", "not-a-url", "Find the bridge.", "CRC"],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.equal(result.errors[0].code, "invalid_url");
    assert.equal(result.errors[0].message, "Row 2: Location must be a valid https URL.");
  });

  it("returns an error for duplicate landmarks in the same file", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Landmark", "Location", "Clue", "Campus Population"],
        ["BU Bridge", "https://example.com/a", "Find one.", "CRC"],
        [" bu   bridge ", "https://example.com/b", "Find two.", "CRC"],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.equal(result.errors[0].code, "duplicate_landmark");
    assert.equal(result.errors[0].message, "Row 3: Duplicate landmark in file: bu bridge.");
  });

  it("returns header errors for missing required columns", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Landmark", "Map", "Clue", "Campus Population"],
        ["BU Bridge", "https://example.com", "Find it.", "CRC"],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.equal(result.errors[0].code, "missing_required_column");
    assert.equal(result.errors[0].message, "Missing required column: Location.");
  });

  it("returns header errors for duplicate columns", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Landmark", "Location", "Clue", "Campus Population", "clue"],
        ["BU Bridge", "https://example.com", "Find it.", "CRC", "Duplicate header"],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.equal(result.errors[0].code, "duplicate_column");
    assert.equal(result.errors[0].message, "Duplicate column header: clue.");
  });

  it("parses csv data", () => {
    const result = parseEventLocationImportFile(
      Buffer.from(
        "Landmark,Location,Clue,Campus Population\nBU Bridge,https://example.com,Find it,CRC",
        "utf8",
      ),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.locations[0].landmark, "BU Bridge");
  });

  it("normalizes legacy Windows punctuation in clues", () => {
    const result = parseEventLocationImportFile(
      makeWorkbookBuffer([
        ["Landmark", "Location", "Clue", "Campus Population"],
        [
          "Statue",
          "https://example.com/statue",
          "Find the \u0093Founding Father\u0094. He\u0092s nearby\u0097look carefully.",
          "Students",
        ],
      ]),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(
      result.locations[0].clue,
      "Find the “Founding Father”. He’s nearby—look carefully.",
    );
  });
});

function makeWorkbookBuffer(rows: unknown[][]) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  }) as Buffer;
}
