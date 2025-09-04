export const formatDate = (date?: Date | string | null): string => {
  if (!date) return '';

  // Convert string → Date
  const d = typeof date === 'string' ? new Date(date) : date;

  // Invalid date handling
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
