export function formatCurrency(amount: number | undefined | null, currency = 'INR'): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency === 'INR' ? 'INR' : currency,
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(timeString?: string): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  if (!hours || !minutes) return timeString;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
}

export function isOverdue(dateString?: string, status?: string): boolean {
  if (!dateString) return false;
  if (status === 'Completed' || status === 'Cancelled') return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
}

export function isDueSoon(dateString?: string, status?: string, withinDays = 3): boolean {
  if (!dateString) return false;
  if (status === 'Completed' || status === 'Cancelled') return false;
  const today = new Date();
  const target = new Date(dateString);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= withinDays;
}

export function getPaymentBadgeClass(status?: string): string {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
    case 'Partially Paid':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
    case 'Unpaid':
    default:
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
  }
}

export function getServiceStatusBadgeClass(status?: string): string {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20';
    case 'Cancelled':
      return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/20';
    case 'Scheduled':
    default:
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-600/20';
  }
}
