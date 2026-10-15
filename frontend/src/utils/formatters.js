import config from '../config/index.js';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const currencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: config.currency });
const numberFormatter = new Intl.NumberFormat();

export const formatDate = (value) => (value ? dateTimeFormatter.format(new Date(value)) : '-');

export const formatCurrency = (value) => currencyFormatter.format(value ?? 0);

export const formatNumber = (value) => numberFormatter.format(value ?? 0);

// Signed quantity for stock movements: +5, -3, 0
export const formatQuantityChange = (value) => (value > 0 ? `+${formatNumber(value)}` : formatNumber(value));
