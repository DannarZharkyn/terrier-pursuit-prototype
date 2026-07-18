import * as XLSX from "xlsx";

export type ParticipantImportField = "First Name" | "Last Name" | "Email" | "Header";

export type ParticipantImportErrorCode =
  | "missing_required_column"
  | "duplicate_column"
  | "missing_required_value"
  | "invalid_email"
  | "duplicate_email";

export type ParticipantImportError = {
  rowNumber?: number;
  field?: ParticipantImportField;
  code: ParticipantImportErrorCode;
  message: string;
};

export type ParsedParticipant = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  normalizedFirstName: string;
  normalizedLastName: string;
  normalizedEmail: string;
};

export type ParticipantImportSummary = {
  totalRows: number;
  importedRows: number;
  blankRows: number;
};

export type ParticipantImportResult =
  | {
      ok: true;
      participants: ParsedParticipant[];
      summary: ParticipantImportSummary;
    }
  | {
      ok: false;
      errors: ParticipantImportError[];
      summary: ParticipantImportSummary;
    };

const requiredHeaders = ["First Name", "Last Name", "Email"] as const;

type RequiredHeader = (typeof requiredHeaders)[number];

type HeaderIndexes = Record<RequiredHeader, number>;

export function parseParticipantImportFile(
  fileData: ArrayBuffer | Uint8Array | Buffer,
): ParticipantImportResult {
  const workbook = XLSX.read(fileData, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return failure([
      {
        field: "Header",
        code: "missing_required_column",
        message: "The spreadsheet must include a header row.",
      },
    ]);
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: true,
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    return failure([
      {
        field: "Header",
        code: "missing_required_column",
        message: "The spreadsheet must include a header row.",
      },
    ]);
  }

  const headerResult = readHeaderIndexes(rows[0]);
  const dataRows = rows.slice(1);
  const blankRows = countBlankRows(dataRows, headerResult.indexes);
  const summaryBase = {
    totalRows: dataRows.length,
    importedRows: 0,
    blankRows,
  };

  if (headerResult.errors.length > 0 || !headerResult.indexes) {
    return {
      ok: false,
      errors: headerResult.errors,
      summary: summaryBase,
    };
  }

  const headerIndexes = headerResult.indexes;
  const participants: ParsedParticipant[] = [];
  const errors: ParticipantImportError[] = [];
  const seenEmails = new Map<string, number>();

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;

    if (isBlankParticipantRow(row, headerIndexes)) {
      return;
    }

    const firstName = normalizeDisplayValue(row[headerIndexes["First Name"]]);
    const lastName = normalizeDisplayValue(row[headerIndexes["Last Name"]]);
    const email = normalizeEmailDisplayValue(row[headerIndexes.Email]);
    const normalizedEmail = email.toLowerCase();

    if (!firstName) {
      errors.push(requiredValueError(rowNumber, "First Name"));
    }

    if (!lastName) {
      errors.push(requiredValueError(rowNumber, "Last Name"));
    }

    if (!email) {
      errors.push(requiredValueError(rowNumber, "Email"));
    } else if (!isValidEmail(normalizedEmail)) {
      errors.push({
        rowNumber,
        field: "Email",
        code: "invalid_email",
        message: `Row ${rowNumber}: Email must be a valid email address.`,
      });
    } else {
      const firstSeenRow = seenEmails.get(normalizedEmail);

      if (firstSeenRow) {
        errors.push({
          rowNumber,
          field: "Email",
          code: "duplicate_email",
          message: `Row ${rowNumber}: Duplicate email in file: ${normalizedEmail}.`,
        });
      } else {
        seenEmails.set(normalizedEmail, rowNumber);
      }
    }

    participants.push({
      rowNumber,
      firstName,
      lastName,
      email,
      normalizedFirstName: firstName.toLowerCase(),
      normalizedLastName: lastName.toLowerCase(),
      normalizedEmail,
    });
  });

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      summary: summaryBase,
    };
  }

  return {
    ok: true,
    participants,
    summary: {
      ...summaryBase,
      importedRows: participants.length,
    },
  };
}

function readHeaderIndexes(headerRow: unknown[]): {
  indexes?: HeaderIndexes;
  errors: ParticipantImportError[];
} {
  const errors: ParticipantImportError[] = [];
  const normalizedHeaders = headerRow.map((header) => normalizeHeaderValue(header));
  const seenHeaders = new Map<string, number>();

  normalizedHeaders.forEach((header, index) => {
    if (!header) {
      return;
    }

    const firstSeenColumn = seenHeaders.get(header);

    if (firstSeenColumn !== undefined) {
      errors.push({
        field: "Header",
        code: "duplicate_column",
        message: `Duplicate column header: ${String(headerRow[index]).trim()}.`,
      });
    } else {
      seenHeaders.set(header, index);
    }
  });

  const indexes = {} as HeaderIndexes;

  requiredHeaders.forEach((requiredHeader) => {
    const index = normalizedHeaders.indexOf(normalizeHeaderValue(requiredHeader));

    if (index === -1) {
      errors.push({
        field: "Header",
        code: "missing_required_column",
        message: `Missing required column: ${requiredHeader}.`,
      });
      return;
    }

    indexes[requiredHeader] = index;
  });

  return {
    indexes: errors.length === 0 ? indexes : undefined,
    errors,
  };
}

function failure(errors: ParticipantImportError[]): ParticipantImportResult {
  return {
    ok: false,
    errors,
    summary: {
      totalRows: 0,
      importedRows: 0,
      blankRows: 0,
    },
  };
}

function requiredValueError(
  rowNumber: number,
  field: Exclude<ParticipantImportField, "Header">,
): ParticipantImportError {
  return {
    rowNumber,
    field,
    code: "missing_required_value",
    message: `Row ${rowNumber}: ${field} is required.`,
  };
}

function countBlankRows(rows: unknown[][], indexes?: HeaderIndexes) {
  if (!indexes) {
    return 0;
  }

  return rows.filter((row) => isBlankParticipantRow(row, indexes)).length;
}

function isBlankParticipantRow(row: unknown[], indexes: HeaderIndexes) {
  return requiredHeaders.every((header) => {
    return normalizeDisplayValue(row[indexes[header]]) === "";
  });
}

function normalizeDisplayValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeEmailDisplayValue(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeHeaderValue(value: unknown) {
  return normalizeDisplayValue(value).toLowerCase();
}

function isValidEmail(email: string) {
  if (email.includes(" ")) {
    return false;
  }

  const parts = email.split("@");

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;

  return Boolean(localPart && domain && domain.includes("."));
}
