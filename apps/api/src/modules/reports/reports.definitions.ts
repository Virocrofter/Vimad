export type ReportColumnFormat = 'text' | 'number' | 'currency' | 'percent' | 'date';
export interface ReportColumn {
  key: string;
  label: string;
  format?: ReportColumnFormat;
}
export interface ReportParamDef {
  key: string;
  label: string;
  type: 'date' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  dynamicOptions?: 'properties';
}
export interface ReportDefinition {
  key: string;
  name: string;
  description: string;
  category: 'Operations' | 'Revenue' | 'Guests' | 'Finance';
  params: ReportParamDef[];
  columns: ReportColumn[];
}

const range = (extra: ReportParamDef[] = []): ReportParamDef[] => [
  { key: 'dateFrom', label: 'From', type: 'date', required: true },
  { key: 'dateTo', label: 'To', type: 'date', required: true },
  ...extra,
];

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    key: 'occupancy',
    name: 'Occupancy',
    category: 'Operations',
    description:
      'Rooms available vs sold per day with occupancy %, ADR and revenue. Group by day or room type.',
    params: range([
      {
        key: 'groupBy',
        label: 'Group by',
        type: 'select',
        required: true,
        options: [
          { value: 'DAY', label: 'Day' },
          { value: 'ROOM_TYPE', label: 'Room type' },
        ],
      },
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Date / Room type' },
      { key: 'available', label: 'Avail', format: 'number' },
      { key: 'sold', label: 'Sold', format: 'number' },
      { key: 'occupancyPct', label: 'Occ %', format: 'percent' },
      { key: 'adr', label: 'ADR', format: 'currency' },
      { key: 'revenue', label: 'Revenue', format: 'currency' },
    ],
  },
  {
    key: 'revenue',
    name: 'Revenue',
    category: 'Revenue',
    description: 'Daily posted folio revenue (charges) with count and average.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Date' },
      { key: 'revenue', label: 'Revenue', format: 'currency' },
      { key: 'charges', label: 'Charges', format: 'number' },
      { key: 'average', label: 'Avg / charge', format: 'currency' },
    ],
  },
  {
    key: 'adr_revpar',
    name: 'ADR & RevPAR',
    category: 'Revenue',
    description: 'Daily average daily rate and revenue per available room.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Date' },
      { key: 'available', label: 'Avail', format: 'number' },
      { key: 'sold', label: 'Sold', format: 'number' },
      { key: 'adr', label: 'ADR', format: 'currency' },
      { key: 'revpar', label: 'RevPAR', format: 'currency' },
    ],
  },
  {
    key: 'channel_mix',
    name: 'Channel Mix',
    category: 'Revenue',
    description: 'Reservations, room nights and revenue by booking channel/source.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Channel' },
      { key: 'reservations', label: 'Reservations', format: 'number' },
      { key: 'roomNights', label: 'Room nights', format: 'number' },
      { key: 'revenue', label: 'Revenue', format: 'currency' },
      { key: 'sharePct', label: 'Share %', format: 'percent' },
    ],
  },
  {
    key: 'ar_aging',
    name: 'AR Aging',
    category: 'Finance',
    description: 'Outstanding corporate AR invoices aged into buckets by due date.',
    params: [{ key: 'asOfDate', label: 'As of', type: 'date', required: true }],
    columns: [
      { key: 'label', label: 'Corporate account' },
      { key: 'invoices', label: 'Invoices', format: 'number' },
      { key: 'b0', label: 'Current', format: 'currency' },
      { key: 'b30', label: '1-30', format: 'currency' },
      { key: 'b60', label: '31-60', format: 'currency' },
      { key: 'b90', label: '61-90', format: 'currency' },
      { key: 'b90p', label: '90+', format: 'currency' },
      { key: 'total', label: 'Total', format: 'currency' },
    ],
  },
  {
    key: 'housekeeping',
    name: 'Housekeeping Status',
    category: 'Operations',
    description: 'Every room with its current housekeeping status, grouped by property.',
    params: [
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ],
    columns: [
      { key: 'property', label: 'Property' },
      { key: 'room', label: 'Room' },
      { key: 'roomType', label: 'Type' },
      { key: 'status', label: 'HK status' },
    ],
  },
  {
    key: 'arrivals_departures',
    name: 'Arrivals & Departures',
    category: 'Operations',
    description: 'Who is arriving, in-house or departing across the range.',
    params: range([
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        required: true,
        options: [
          { value: 'BOTH', label: 'Arrivals + departures' },
          { value: 'ARRIVALS', label: 'Arrivals only' },
          { value: 'DEPARTURES', label: 'Departures only' },
        ],
      },
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'direction', label: 'Arr / Dep' },
      { key: 'guest', label: 'Guest' },
      { key: 'room', label: 'Room' },
      { key: 'status', label: 'Status' },
      { key: 'pax', label: 'Pax', format: 'number' },
      { key: 'channel', label: 'Channel' },
    ],
  },
  {
    key: 'no_show_cancellation',
    name: 'No-shows & Cancellations',
    category: 'Guests',
    description: 'Lost business: no-shows and cancellations with revenue impact.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'date', label: 'Arrival date', format: 'date' },
      { key: 'type', label: 'Type' },
      { key: 'guest', label: 'Guest' },
      { key: 'channel', label: 'Channel' },
      { key: 'lostRevenue', label: 'Lost revenue', format: 'currency' },
    ],
  },
  {
    key: 'guest_demographics',
    name: 'Guest Demographics',
    category: 'Guests',
    description: 'Staying guests grouped by nationality with revenue contribution.',
    params: range([
      {
        key: 'groupBy',
        label: 'Group by',
        type: 'select',
        required: true,
        options: [
          { value: 'NATIONALITY', label: 'Nationality' },
          { value: 'COUNTRY', label: 'Country' },
        ],
      },
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Segment' },
      { key: 'guests', label: 'Guests', format: 'number' },
      { key: 'stays', label: 'Stays', format: 'number' },
      { key: 'revenue', label: 'Revenue', format: 'currency' },
      { key: 'sharePct', label: 'Share %', format: 'percent' },
    ],
  },

  {
    key: 'pace',
    name: 'Pace & Pick-up',
    category: 'Revenue',
    description:
      'On-the-books rooms and revenue per day vs the same days in the previous period (realized stays), plus 7-day pick-up.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Date' },
      { key: 'onBooks', label: 'On books', format: 'number' },
      { key: 'revenue', label: 'OTB revenue', format: 'currency' },
      { key: 'pickup7d', label: 'Pick-up 7d', format: 'number' },
      { key: 'compSold', label: 'Comp sold', format: 'number' },
      { key: 'compRevenue', label: 'Comp revenue', format: 'currency' },
    ],
  },
  {
    key: 'forecast',
    name: 'Forecast (On the Books)',
    category: 'Revenue',
    description:
      'Sellable rooms (excluding OOO/OOS), on-the-books occupancy, ADR and RevPAR per future day with rooms remaining.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Date' },
      { key: 'available', label: 'Sellable', format: 'number' },
      { key: 'onBooks', label: 'On books', format: 'number' },
      { key: 'remaining', label: 'Remaining', format: 'number' },
      { key: 'occupancyPct', label: 'Occ %', format: 'percent' },
      { key: 'adr', label: 'ADR', format: 'currency' },
      { key: 'revpar', label: 'RevPAR', format: 'currency' },
    ],
  },
  {
    key: 'revenue_breakdown',
    name: 'Revenue by Charge Type',
    category: 'Revenue',
    description: 'Posted folio revenue grouped by charge type with share of total.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Charge type' },
      { key: 'charges', label: 'Charges', format: 'number' },
      { key: 'revenue', label: 'Revenue', format: 'currency' },
      { key: 'sharePct', label: 'Share %', format: 'percent' },
    ],
  },
  {
    key: 'market_segments',
    name: 'Market Segments',
    category: 'Revenue',
    description: 'Reservations, room nights and revenue by market segment.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Segment' },
      { key: 'reservations', label: 'Reservations', format: 'number' },
      { key: 'roomNights', label: 'Room nights', format: 'number' },
      { key: 'revenue', label: 'Revenue', format: 'currency' },
      { key: 'sharePct', label: 'Share %', format: 'percent' },
    ],
  },
  {
    key: 'space_status',
    name: 'Space Status (OOO/OOS)',
    category: 'Operations',
    description: 'Every room with housekeeping and service status (OOO/OOS) plus the reason.',
    params: [
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ],
    columns: [
      { key: 'property', label: 'Property' },
      { key: 'room', label: 'Room' },
      { key: 'roomType', label: 'Type' },
      { key: 'hkStatus', label: 'HK status' },
      { key: 'serviceStatus', label: 'Service' },
      { key: 'reason', label: 'Reason' },
    ],
  },
  {
    key: 'cancellation_lead',
    name: 'Cancellation Lead Time',
    category: 'Guests',
    description: 'Cancellations bucketed by how far before arrival they were cancelled.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Lead time' },
      { key: 'cancellations', label: 'Cancellations', format: 'number' },
      { key: 'lostRevenue', label: 'Lost revenue', format: 'currency' },
      { key: 'sharePct', label: 'Share %', format: 'percent' },
      { key: 'avgLeadDays', label: 'Avg lead (days)', format: 'number' },
    ],
  },

  {
    key: 'net_pricing',
    name: 'Net Pricing & Commission',
    category: 'Finance',
    description:
      'Gross booking revenue by rate plan with OTA commission (commission-inclusive net pricing) and net revenue.',
    params: range([
      { key: 'propertyId', label: 'Property', type: 'select', dynamicOptions: 'properties' },
    ]),
    columns: [
      { key: 'label', label: 'Rate plan' },
      { key: 'reservations', label: 'Reservations', format: 'number' },
      { key: 'commissionPct', label: 'Comm %', format: 'percent' },
      { key: 'grossRevenue', label: 'Gross', format: 'currency' },
      { key: 'commission', label: 'Commission', format: 'currency' },
      { key: 'netRevenue', label: 'Net', format: 'currency' },
    ],
  },
];

export const getDefinition = (key: string): ReportDefinition | undefined =>
  REPORT_DEFINITIONS.find((d) => d.key === key);
