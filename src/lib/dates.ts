const shortMonthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
});

const longDayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const mediumDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function formatShortMonthDay(date: Date) {
  return shortMonthDayFormatter.format(date);
}

export function formatLongDate(date: Date) {
  return longDayFormatter.format(date);
}

export function formatMediumDate(date: Date) {
  return mediumDateFormatter.format(date);
}
