/* apps/api/src/modules/onboarding/onboarding.csv.ts
 * Dependency-free CSV parser (quoted fields, escaped quotes, CRLF) plus the
 * canonical column layout for the bulk onboarding wizard.
 */
export const ONBOARDING_CSV_HEADERS = [
  'propertyCode',
  'propertyName',
  'city',
  'country',
  'timezone',
  'currency',
  'roomTypeCode',
  'roomTypeName',
  'baseOccupancy',
  'maxOccupancy',
  'roomNumber',
  'floor',
  'ratePlanCode',
  'ratePlanName',
  'baseRate',
] as const;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  const flushRow = () => {
    row.push(field);
    field = '';
    if (row.length > 1 || row[0] !== '') rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      flushRow();
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) flushRow();

  return rows.map((r) => r.map((v) => v.trim()));
}

const SAMPLE_ROWS = [
  [
    'IMPORT-UHM',
    'Umhlanga Import Hotel',
    'Umhlanga',
    'ZA',
    'Africa/Johannesburg',
    'ZAR',
    'UQ',
    'Umhlanga Queen',
    '2',
    '2',
    '101',
    '1',
    'UQ-RACK',
    'Umhlanga Queen Rack',
    '1650.00',
  ],
  [
    'IMPORT-UHM',
    'Umhlanga Import Hotel',
    'Umhlanga',
    'ZA',
    'Africa/Johannesburg',
    'ZAR',
    'UQ',
    'Umhlanga Queen',
    '2',
    '2',
    '102',
    '1',
    'UQ-RACK',
    'Umhlanga Queen Rack',
    '1650.00',
  ],
  [
    'IMPORT-UHM',
    'Umhlanga Import Hotel',
    'Umhlanga',
    'ZA',
    'Africa/Johannesburg',
    'ZAR',
    'UK',
    'Umhlanga King',
    '2',
    '3',
    '201',
    '2',
    'UK-RACK',
    'Umhlanga King Rack',
    '2190.00',
  ],
  [
    'IMPORT-BAL',
    'Ballito Import Lodge',
    'Ballito',
    'ZA',
    'Africa/Johannesburg',
    'ZAR',
    'BQ',
    'Ballito Queen',
    '2',
    '2',
    '101',
    '1',
    'BQ-RACK',
    'Ballito Queen Rack',
    '1290.00',
  ],
  [
    'IMPORT-BAL',
    'Ballito Import Lodge',
    'Ballito',
    'ZA',
    'Africa/Johannesburg',
    'ZAR',
    'BK',
    'Ballito King',
    '2',
    '3',
    '102',
    '1',
    'BK-RACK',
    'Ballito King Rack',
    '1750.00',
  ],
  [
    'IMPORT-DBN',
    'Durban North Import Hotel',
    'Durban North',
    'ZA',
    'Africa/Johannesburg',
    'ZAR',
    'DQ',
    'Durban Queen',
    '2',
    '2',
    '101',
    '1',
    'DQ-RACK',
    'Durban Queen Rack',
    '1150.00',
  ],
  [
    'IMPORT-GLN',
    'Glenwood Import House',
    'Glenwood',
    'ZA',
    'Africa/Johannesburg',
    'ZAR',
    'GQ',
    'Glenwood Queen',
    '2',
    '2',
    '101',
    '1',
    'GQ-RACK',
    'Glenwood Queen Rack',
    '950.00',
  ],
  [
    'IMPORT-GLN',
    'Glenwood Import House',
    'Glenwood',
    'ZA',
    'Africa/Johannesburg',
    'ZAR',
    'GS',
    'Glenwood Suite',
    '2',
    '4',
    '201',
    '2',
    'GS-RACK',
    'Glenwood Suite Rack',
    '1490.00',
  ],
];

export function buildTemplateCsv(): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [ONBOARDING_CSV_HEADERS.join(','), ...SAMPLE_ROWS.map((r) => r.map(esc).join(','))];
  return lines.join('\n') + '\n';
}
