
export const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%
export const MINIMUM_WITHDRAWAL = 200; // KES
export const CURRENCY = 'KES';

// Regex for Kenyan Phone Numbers (formats: 07xx, 01xx, 2547xx, +2547xx)
// Matches widely used formats to prevent contact exchange in public chat
export const PHONE_REGEX = /(?:\+254|254|0)?((?:7|1)\d{8})/g;

// Regex for Email addresses
export const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,6}/g;

export const UNIVERSITIES = [
  'Kirinyaga University',
  'UoN',
  'KU',
  'JKUAT',
  'Strathmore',
  'Egerton',
  'Moi',
  'Maseno',
  'MMUST',
  'TUK',
  'TUM',
  'DeKUT',
  'MKU',
  'USIU-Africa',
  'Daystar',
  'KCA',
  'CUEA',
  'Kabarak',
  'KeMU',
  'MMU',
  'MUST',
  'Kisii',
  'Chuka',
  'Machakos',
  "Murang'a",
  'Embu',
  'SEKU',
  'Laikipia',
  'Pwani',
  'Kibabii',
  'Karatina',
  'Maasai Mara',
  'Taita Taveta',
  'Zetech',
  'Riara',
  'Africa Nazarene',
  'Cooperative University',
  'Garissa',
  'Rongo',
  'Tharaka',
  'Tom Mboya',
  'Alupe',
  'Other'
];

export const TERMS_SNIPPET = "By uploading, I confirm these notes are my original summaries and do not violate university copyright policies.";
