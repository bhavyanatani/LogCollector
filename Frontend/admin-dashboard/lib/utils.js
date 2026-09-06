export function formatNumber(value) {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return Number(value).toLocaleString('en-US');
}

export function formatPercent(value) {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  return `${Number(value).toFixed(2)}%`;
}

export function formatMs(value) {
  if (value === undefined || value === null || isNaN(value)) return '0 ms';
  return `${Number(value).toFixed(0)} ms`;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (e) {
    return String(dateStr);
  }
}

export function exportLogsJSON(logs, filename = `logs_export_${new Date().toISOString().slice(0, 10)}.json`) {
  if (!logs || logs.length === 0) return;
  const jsonStr = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLogsCSV(logs, filename = `logs_export_${new Date().toISOString().slice(0, 10)}.csv`) {
  if (!logs || logs.length === 0) return;

  const headers = [
    'Timestamp',
    'Service',
    'Level',
    'Event',
    'Message',
    'Request ID',
    'User ID',
    'Order ID',
    'HTTP Method',
    'HTTP Path',
    'HTTP Status',
    'Latency (ms)'
  ];

  const escapeCSV = (val) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = logs.map((log) => [
    escapeCSV(log.timestamp),
    escapeCSV(log.service),
    escapeCSV(log.level),
    escapeCSV(log.event),
    escapeCSV(log.message),
    escapeCSV(log.requestId),
    escapeCSV(log.userId),
    escapeCSV(log.orderId),
    escapeCSV(log.http?.method),
    escapeCSV(log.http?.path),
    escapeCSV(log.http?.statusCode),
    escapeCSV(log.performance?.responseTimeMs)
  ]);

  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
