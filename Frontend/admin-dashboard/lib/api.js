const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:4002';

async function fetchAPI(endpoint, queryParams = {}) {
  const url = new URL(`${ANALYTICS_API_URL}${endpoint}`);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.append(key, String(value).trim());
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || `API request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getHealth() {
  return fetchAPI('/health');
}

export async function getOverview(params = {}) {
  return fetchAPI('/analytics/overview', params);
}

export async function getFailures(params = {}) {
  return fetchAPI('/analytics/failures', params);
}

export async function getPerformance(params = {}) {
  return fetchAPI('/analytics/performance', params);
}

export async function getServices(params = {}) {
  return fetchAPI('/analytics/services', params);
}

export async function getErrors(params = {}) {
  return fetchAPI('/analytics/errors', params);
}

export async function getEndpoints(params = {}) {
  return fetchAPI('/analytics/endpoints', params);
}

export async function getSlowEndpoints(params = {}) {
  return fetchAPI('/analytics/endpoints/slow', params);
}

export async function getLogs(params = {}) {
  return fetchAPI('/analytics/logs', params);
}

export async function getLogById(id) {
  return fetchAPI(`/analytics/logs/${id}`);
}

export async function getTrace(requestId) {
  return fetchAPI(`/analytics/traces/${encodeURIComponent(requestId)}`);
}
