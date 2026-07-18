import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";
import { parseParticipantImportFile } from "./participants";

describe("parseParticipantImportFile", () => {
  it("parses valid participant rows and normalizes matching values", () => {
    const result = parseParticipantImportFile(
      makeWorkbookBuffer([
        ["First Name", "Last Name", "Email"],
        ["  Jane  ", "  Van   Buren ", " Jane.Doe@BU.edu "],
      ]),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.deepEqual(result.summary, {
      totalRows: 1,
      importedRows: 1,
      blankRows: 0,
    });
    assert.deepEqual(result.participants[0], {
      rowNumber: 2,
      firstName: "Jane",
      lastName: "Van Buren",
      email: "Jane.Doe@BU.edu",
      normalizedFirstName: "jane",
      normalizedLastName: "van buren",
      normalizedEmail: "jane.doe@bu.edu",
    });
  });

  it("allows extra columns and ignores them", () => {
    const result = parseParticipantImportFile(
      makeWorkbookBuffer([
        ["Email", "Notes", "First Name", "Last Name"],
        ["alex@bu.edu", "Extra data", "Alex", "Morgan"],
      ]),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.participants.length, 1);
    assert.equal(result.participants[0].normalizedEmail, "alex@bu.edu");
  });

  it("ignores fully blank rows", () => {
    const result = parseParticipantImportFile(
      makeWorkbookBuffer([
        ["First Name", "Last Name", "Email"],
        ["Maya", "Patel", "maya@bu.edu"],
        ["", "", ""],
        ["Jordan", "Ellis", "jordan@bu.edu"],
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
  });

  it("returns row-level errors for missing required values", () => {
    const result = parseParticipantImportFile(
      makeWorkbookBuffer([
        ["First Name", "Last Name", "Email"],
        ["Nina", "", "nina@bu.edu"],
        ["", "Brooks", "theo@bu.edu"],
        ["Theo", "Brooks", ""],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.deepEqual(
      result.errors.map((error) => error.message),
      [
        "Row 2: Last Name is required.",
        "Row 3: First Name is required.",
        "Row 4: Email is required.",
      ],
    );
  });

  it("returns an error for invalid email addresses", () => {
    const result = parseParticipantImportFile(
      makeWorkbookBuffer([
        ["First Name", "Last Name", "Email"],
        ["Ava", "Thompson", "ava-at-bu.edu"],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.equal(result.errors[0].code, "invalid_email");
    assert.equal(result.errors[0].message, "Row 2: Email must be a valid email address.");
  });

  it("returns an error for duplicate emails in the same file", () => {
    const result = parseParticipantImportFile(
      makeWorkbookBuffer([
        ["First Name", "Last Name", "Email"],
        ["Grace", "Kim", "Grace.Kim@BU.edu"],
        ["Grace", "Kim", "grace.kim@bu.edu"],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.equal(result.errors[0].code, "duplicate_email");
    assert.equal(result.errors[0].message, "Row 3: Duplicate email in file: grace.kim@bu.edu.");
  });

  it("returns header errors for missing required columns", () => {
    const result = parseParticipantImportFile(
      makeWorkbookBuffer([
        ["First", "Last Name", "Email"],
        ["Luis", "Rivera", "luis@bu.edu"],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.equal(result.errors[0].code, "missing_required_column");
    assert.equal(result.errors[0].message, "Missing required column: First Name.");
  });

  it("returns header errors for duplicate columns", () => {
    const result = parseParticipantImportFile(
      makeWorkbookBuffer([
        ["First Name", "Last Name", "Email", "email"],
        ["Priya", "Rao", "priya@bu.edu", "other@bu.edu"],
      ]),
    );

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.equal(result.errors[0].code, "duplicate_column");
    assert.equal(result.errors[0].message, "Duplicate column header: email.");
  });

  it("parses csv data", () => {
    const result = parseParticipantImportFile(
      Buffer.from("First Name,Last Name,Email\nSam,Goldberg,sam@bu.edu", "utf8"),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.participants[0].normalizedEmail, "sam@bu.edu");
  });
});

function makeWorkbookBuffer(rows: unknown[][]) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  }) as Buffer;
}
