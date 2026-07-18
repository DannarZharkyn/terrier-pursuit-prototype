import * as XLSX from "xlsx";

export type EventLocationImportField =
  | "Landmark"
  | "Location"
  | "Clue"
  | "Campus Population"
  | "Header";

export type EventLocationImportErrorCode =
  | "missing_required_column"
  | "duplicate_column"
  | "missing_required_value"
  | "invalid_url"
  | "duplicate_landmark";

export type EventLocationImportError = {
  rowNumber?: number;
  field?: EventLocationImportField;
  code: EventLocationImportErrorCode;
  message: string;
};

export type ParsedEventLocation = {
  rowNumber: number;
  position: number;
  landmark: string;
  normalizedLandmark: string;
  locationUrl: string;
  clue: string;
  campusPopulation: string;
};

export type EventLocationImportSummary = {
  totalRows: number;
  importedRows: number;
  blankRows: number;
};

export type EventLocationImportResult =
  | {
      ok: true;
      locations: ParsedEventLocation[];
      summary: EventLocationImportSummary;
    }
  | {
      ok: false;
      errors: EventLocationImportError[];
      summary: EventLocationImportSummary;
    };

const requiredHeaders = ["Landmark", "Location", "Clue", "Campus Population"] as const;

type RequiredHeader = (typeof requiredHeaders)[number];

type HeaderIndexes = Record<RequiredHeader, number>;

export function parseEventLocationImportFile(
  fileData: ArrayBuffer | Uint8Array | Buffer,
): EventLocationImportResult {
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
  const locations: ParsedEventLocation[] = [];
  const errors: EventLocationImportError[] = [];
  const seenLandmarks = new Map<string, number>();
  let position = 0;

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;

    if (isBlankLocationRow(row, headerIndexes)) {
      return;
    }

    position += 1;

    const landmark = normalizeDisplayValue(row[headerIndexes.Landmark]);
    const locationUrl = normalizeDisplayValue(row[headerIndexes.Location]);
    const clue = normalizeDisplayValue(row[headerIndexes.Clue]);
    const campusPopulation = normalizeDisplayValue(row[headerIndexes["Campus Population"]]);
    const normalizedLandmark = landmark.toLowerCase();

    if (!landmark) {
      errors.push(requiredValueError(rowNumber, "Landmark"));
    } else {
      const firstSeenRow = seenLandmarks.get(normalizedLandmark);

      if (firstSeenRow) {
        errors.push({
          rowNumber,
          field: "Landmark",
          code: "duplicate_landmark",
          message: `Row ${rowNumber}: Duplicate landmark in file: ${landmark}.`,
        });
      } else {
        seenLandmarks.set(normalizedLandmark, rowNumber);
      }
    }

    if (!locationUrl) {
      errors.push(requiredValueError(rowNumber, "Location"));
    } else if (!isValidHttpsUrl(locationUrl)) {
      errors.push({
        rowNumber,
        field: "Location",
        code: "invalid_url",
        message: `Row ${rowNumber}: Location must be a valid https URL.`,
      });
    }

    if (!clue) {
      errors.push(requiredValueError(rowNumber, "Clue"));
    }

    if (!campusPopulation) {
      errors.push(requiredValueError(rowNumber, "Campus Population"));
    }

    locations.push({
      rowNumber,
      position,
      landmark,
      normalizedLandmark,
      locationUrl,
      clue,
      campusPopulation,
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
    locations,
    summary: {
      ...summaryBase,
      importedRows: locations.length,
    },
  };
}

function readHeaderIndexes(headerRow: unknown[]): {
  indexes?: HeaderIndexes;
  errors: EventLocationImportError[];
} {
  const errors: EventLocationImportError[] = [];
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

function failure(errors: EventLocationImportError[]): EventLocationImportResult {
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
  field: Exclude<EventLocationImportField, "Header">,
): EventLocationImportError {
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

  return rows.filter((row) => isBlankLocationRow(row, indexes)).length;
}

function isBlankLocationRow(row: unknown[], indexes: HeaderIndexes) {
  return requiredHeaders.every((header) => {
    return normalizeDisplayValue(row[indexes[header]]) === "";
  });
}

function normalizeDisplayValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeHeaderValue(value: unknown) {
  return normalizeDisplayValue(value).toLowerCase();
}

function isValidHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
