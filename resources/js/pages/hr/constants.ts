export const HR_CURRENCIES = [
    { code: 'USD', label: 'USD', symbol: '$' },
    { code: 'EUR', label: 'EUR', symbol: '€' },
    { code: 'GBP', label: 'GBP', symbol: '£' },
    { code: 'NGN', label: 'NGN (Naira)', symbol: '₦' },
] as const;

export const STAFF_DOCUMENT_TYPES = [
    { value: 'contract', label: 'Contract' },
    { value: 'id', label: 'ID document' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' },
] as const;
