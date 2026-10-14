const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const formatDate = (value) => (value ? formatter.format(new Date(value)) : '-');

export default formatDate;
