const mongoose = require('mongoose');
const ProcessedLog = require('../models/ProcessedLog');

function buildMatchFilter({ range, service, from, to }) {
  if (range && (from || to)) {
    const error = new Error('Conflicting time filters supplied: Use either range or from/to parameters, not both.');
    error.statusCode = 400;
    throw error;
  }

  const match = {};

  if (service) {
    match.service = String(service).trim();
  }

  if (from || to) {
    match.timestamp = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        const err = new Error("Invalid 'from' date parameter format");
        err.statusCode = 400;
        throw err;
      }
      match.timestamp.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        const err = new Error("Invalid 'to' date parameter format");
        err.statusCode = 400;
        throw err;
      }
      match.timestamp.$lte = toDate;
    }
  } else {
    // Default or specified range filtering (1h, 6h, 24h, 7d)
    const effectiveRange = range || '24h';
    const now = new Date();
    let cutoff = new Date();

    switch (effectiveRange) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoff.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoff.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      default:
        const err = new Error(`Invalid range parameter '${effectiveRange}'. Allowed values: 1h, 6h, 24h, 7d`);
        err.statusCode = 400;
        throw err;
    }

    match.timestamp = { $gte: cutoff };
  }

  return { match, effectiveRange: range || '24h' };
}

async function getOverviewAnalytics(filters) {
  const { match } = buildMatchFilter(filters);

  const pipeline = [
    { $match: match },
    {
      $facet: {
        stats: [
          {
            $group: {
              _id: null,
              totalLogs: { $sum: 1 },
              totalRequests: {
                $sum: { $cond: [{ $ifNull: ['$http', false] }, 1, 0] }
              },
              totalErrors: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ['$level', 'ERROR'] },
                        { $eq: ['$analytics.isServerError', true] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              slowRequests: {
                $sum: { $cond: [{ $eq: ['$analytics.isSlowRequest', true] }, 1, 0] }
              },
              verySlowRequests: {
                $sum: { $cond: [{ $eq: ['$analytics.isVerySlowRequest', true] }, 1, 0] }
              },
              businessFailures: {
                $sum: { $cond: [{ $eq: ['$analytics.isBusinessFailure', true] }, 1, 0] }
              },
              externalServiceFailures: {
                $sum: { $cond: [{ $eq: ['$analytics.isExternalServiceFailure', true] }, 1, 0] }
              },
              avgResponseTime: { $avg: '$performance.responseTimeMs' }
            }
          }
        ]
      }
    }
  ];

  const result = await ProcessedLog.aggregate(pipeline);
  const data = result[0]?.stats[0] || {};

  const totalLogs = data.totalLogs || 0;
  const totalRequests = data.totalRequests || 0;
  const totalErrors = data.totalErrors || 0;
  const slowRequests = data.slowRequests || 0;
  const verySlowRequests = data.verySlowRequests || 0;
  const businessFailures = data.businessFailures || 0;
  const externalServiceFailures = data.externalServiceFailures || 0;
  const averageResponseTimeMs = Math.round((data.avgResponseTime || 0) * 100) / 100;

  const errorRate = totalRequests > 0
    ? Math.round((totalErrors / totalRequests) * 100 * 100) / 100
    : 0;

  return {
    totalLogs,
    totalRequests,
    totalErrors,
    errorRate,
    slowRequests,
    verySlowRequests,
    businessFailures,
    externalServiceFailures,
    averageResponseTimeMs
  };
}

async function getFailureAnalytics(filters, limitVal = 10) {
  const { match } = buildMatchFilter(filters);
  const limit = Math.max(1, parseInt(limitVal) || 10);

  const failureMatch = {
    ...match,
    $or: [
      { 'analytics.isBusinessFailure': true },
      { 'analytics.isExternalServiceFailure': true },
      { level: 'ERROR' }
    ]
  };

  const pipeline = [
    { $match: failureMatch },
    {
      $group: {
        _id: { service: '$service', event: '$event' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ];

  const results = await ProcessedLog.aggregate(pipeline);
  const totalFailures = results.reduce((sum, item) => sum + item.count, 0);

  const formattedResults = results.slice(0, limit).map((item) => {
    const percentageOfFailures = totalFailures > 0
      ? Math.round((item.count / totalFailures) * 100 * 100) / 100
      : 0;

    return {
      service: item._id.service,
      event: item._id.event,
      count: item.count,
      percentageOfFailures
    };
  });

  return formattedResults;
}

async function getPerformanceAnalytics(filters) {
  const { match, effectiveRange } = buildMatchFilter(filters);

  const perfMatch = {
    ...match,
    'performance.responseTimeMs': { $exists: true, $ne: null }
  };

  // Summary aggregation
  const summaryPipeline = [
    { $match: perfMatch },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$performance.responseTimeMs' },
        minResponseTime: { $min: '$performance.responseTimeMs' },
        maxResponseTime: { $max: '$performance.responseTimeMs' },
        slowRequestCount: {
          $sum: { $cond: [{ $eq: ['$analytics.isSlowRequest', true] }, 1, 0] }
        },
        verySlowRequestCount: {
          $sum: { $cond: [{ $eq: ['$analytics.isVerySlowRequest', true] }, 1, 0] }
        }
      }
    }
  ];

  const summaryResult = await ProcessedLog.aggregate(summaryPipeline);
  const sData = summaryResult[0] || {};

  const summary = {
    averageResponseTimeMs: Math.round((sData.avgResponseTime || 0) * 100) / 100,
    minimumResponseTimeMs: sData.minResponseTime !== undefined ? sData.minResponseTime : 0,
    maximumResponseTimeMs: sData.maxResponseTime !== undefined ? sData.maxResponseTime : 0,
    slowRequestCount: sData.slowRequestCount || 0,
    verySlowRequestCount: sData.verySlowRequestCount || 0
  };

  // Time trend aggregation bucket
  const dateFormat = effectiveRange === '7d' ? '%Y-%m-%dT00:00:00.000Z' : '%Y-%m-%dT%H:00:00.000Z';

  const trendPipeline = [
    { $match: perfMatch },
    {
      $group: {
        _id: {
          $dateToString: { format: dateFormat, date: '$timestamp' }
        },
        avgResponseTime: { $avg: '$performance.responseTimeMs' },
        requestCount: { $sum: 1 },
        slowRequestCount: {
          $sum: { $cond: [{ $eq: ['$analytics.isSlowRequest', true] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const trendResults = await ProcessedLog.aggregate(trendPipeline);

  const trend = trendResults.map((t) => ({
    time: t._id,
    averageResponseTimeMs: Math.round((t.avgResponseTime || 0) * 100) / 100,
    requestCount: t.requestCount,
    slowRequestCount: t.slowRequestCount
  }));

  return {
    summary,
    trend
  };
}

async function getServicesAnalytics(filters) {
  const { match } = buildMatchFilter(filters);

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$service',
        requests: {
          $sum: { $cond: [{ $ifNull: ['$http', false] }, 1, 0] }
        },
        errors: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ['$level', 'ERROR'] },
                  { $eq: ['$analytics.isServerError', true] }
                ]
              },
              1,
              0
            ]
          }
        },
        avgResponseTime: { $avg: '$performance.responseTimeMs' },
        slowRequests: {
          $sum: { $cond: [{ $eq: ['$analytics.isSlowRequest', true] }, 1, 0] }
        },
        businessFailures: {
          $sum: { $cond: [{ $eq: ['$analytics.isBusinessFailure', true] }, 1, 0] }
        },
        externalServiceFailures: {
          $sum: { $cond: [{ $eq: ['$analytics.isExternalServiceFailure', true] }, 1, 0] }
        }
      }
    }
  ];

  const results = await ProcessedLog.aggregate(pipeline);

  const services = results.map((item) => {
    const requests = item.requests || 0;
    const errors = item.errors || 0;
    const errorRate = requests > 0
      ? Math.round((errors / requests) * 100 * 100) / 100
      : 0;

    return {
      service: item._id,
      requests,
      errors,
      errorRate,
      averageResponseTimeMs: Math.round((item.avgResponseTime || 0) * 100) / 100,
      slowRequests: item.slowRequests || 0,
      businessFailures: item.businessFailures || 0,
      externalServiceFailures: item.externalServiceFailures || 0
    };
  });

  // Sort by errorRate descending
  services.sort((a, b) => b.errorRate - a.errorRate);

  return services;
}

async function getErrorAnalytics(filters, limitVal = 20) {
  const { match } = buildMatchFilter(filters);
  const limit = Math.max(1, parseInt(limitVal) || 20);

  const errorMatch = {
    ...match,
    $or: [
      { level: 'ERROR' },
      { 'analytics.isServerError': true }
    ]
  };

  const pipeline = [
    { $match: errorMatch },
    {
      $group: {
        _id: { service: '$service', event: '$event', level: '$level' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ];

  const results = await ProcessedLog.aggregate(pipeline);

  return results.map((item) => ({
    service: item._id.service,
    event: item._id.event,
    level: item._id.level,
    count: item.count
  }));
}

async function getLogsExplorer({ service, level, event, from, to, page = 1, limit = 20 }) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

  const query = {};

  if (service) query.service = String(service).trim();
  if (level) query.level = String(level).trim().toUpperCase();
  if (event) query.event = String(event).trim();

  if (from || to) {
    query.timestamp = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        const err = new Error("Invalid 'from' date parameter format");
        err.statusCode = 400;
        throw err;
      }
      query.timestamp.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        const err = new Error("Invalid 'to' date parameter format");
        err.statusCode = 400;
        throw err;
      }
      query.timestamp.$lte = toDate;
    }
  }

  const totalLogs = await ProcessedLog.countDocuments(query);
  const totalPages = Math.ceil(totalLogs / limitNum) || 1;

  const logs = await ProcessedLog.find(query)
    .sort({ timestamp: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  return {
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalLogs,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1
    }
  };
}

async function getLogById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid log ID format');
    err.statusCode = 400;
    throw err;
  }

  const log = await ProcessedLog.findById(id).lean();

  if (!log) {
    const err = new Error('Processed log not found');
    err.statusCode = 404;
    throw err;
  }

  return log;
}

async function getTraceByRequestId(requestId) {
  if (!requestId || typeof requestId !== 'string' || requestId.trim() === '') {
    const err = new Error('Invalid or missing requestId parameter');
    err.statusCode = 400;
    throw err;
  }

  const cleanRequestId = requestId.trim();

  const logs = await ProcessedLog.find({ requestId: cleanRequestId })
    .sort({ timestamp: 1 })
    .lean();

  if (!logs || logs.length === 0) {
    const err = new Error('Trace not found');
    err.statusCode = 404;
    throw err;
  }

  // Calculate status: FAILED if any log level === 'ERROR' or analytics.isServerError === true
  const hasError = logs.some(
    (l) => l.level === 'ERROR' || l.analytics?.isServerError === true
  );
  const status = hasError ? 'FAILED' : 'SUCCESS';

  // Calculate durationMs: last event timestamp - first event timestamp
  let durationMs = 0;
  if (logs.length > 1) {
    const firstTime = new Date(logs[0].timestamp).getTime();
    const lastTime = new Date(logs[logs.length - 1].timestamp).getTime();
    durationMs = Math.max(0, lastTime - firstTime);
  }

  // Collect unique services in chronological order of appearance
  const servicesSet = new Set();
  logs.forEach((l) => {
    if (l.service) servicesSet.add(l.service);
  });
  const services = Array.from(servicesSet);

  // Build timeline events
  const timeline = logs.map((l) => ({
    _id: l._id,
    timestamp: l.timestamp,
    service: l.service,
    event: l.event,
    level: l.level,
    message: l.message,
    requestId: l.requestId,
    userId: l.userId,
    orderId: l.orderId,
    http: l.http,
    performance: l.performance,
    metadata: l.metadata,
    error: l.error,
    analytics: l.analytics
  }));

  return {
    requestId: cleanRequestId,
    status,
    durationMs,
    totalEvents: logs.length,
    services,
    timeline
  };
}

async function getEndpointAnalytics(filters, limitVal = 10) {
  const { match } = buildMatchFilter(filters);
  const limit = Math.max(1, parseInt(limitVal) || 10);

  const endpointMatch = {
    ...match,
    'http.method': { $exists: true, $ne: null },
    'http.path': { $exists: true, $ne: null }
  };

  const pipeline = [
    { $match: endpointMatch },
    {
      $group: {
        _id: { method: '$http.method', path: '$http.path' },
        requests: { $sum: 1 },
        errors: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ['$level', 'ERROR'] },
                  { $eq: ['$analytics.isServerError', true] },
                  { $eq: ['$analytics.isBusinessFailure', true] },
                  { $eq: ['$analytics.isExternalServiceFailure', true] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { errors: -1, requests: -1 } },
    { $limit: limit }
  ];

  const results = await ProcessedLog.aggregate(pipeline);

  return results.map((item) => {
    const requests = item.requests || 0;
    const errors = item.errors || 0;
    const errorRate = requests > 0
      ? Math.round((errors / requests) * 100 * 100) / 100
      : 0;

    return {
      method: item._id.method,
      path: item._id.path,
      requests,
      errors,
      errorRate
    };
  });
}

async function getSlowEndpointsAnalytics(filters, limitVal = 10) {
  const { match } = buildMatchFilter(filters);
  const limit = Math.max(1, parseInt(limitVal) || 10);

  const slowMatch = {
    ...match,
    'http.method': { $exists: true, $ne: null },
    'http.path': { $exists: true, $ne: null },
    'performance.responseTimeMs': { $exists: true, $gt: 0 }
  };

  const pipeline = [
    { $match: slowMatch },
    {
      $group: {
        _id: { method: '$http.method', path: '$http.path' },
        avgResponseTimeMs: { $avg: '$performance.responseTimeMs' },
        maxResponseTimeMs: { $max: '$performance.responseTimeMs' },
        slowRequestCount: {
          $sum: { $cond: [{ $eq: ['$analytics.isSlowRequest', true] }, 1, 0] }
        },
        totalRequests: { $sum: 1 }
      }
    },
    { $sort: { avgResponseTimeMs: -1 } },
    { $limit: limit }
  ];

  const results = await ProcessedLog.aggregate(pipeline);

  return results.map((item) => ({
    method: item._id.method,
    path: item._id.path,
    averageResponseTimeMs: Math.round((item.avgResponseTimeMs || 0) * 100) / 100,
    maximumResponseTimeMs: item.maxResponseTimeMs || 0,
    slowRequestCount: item.slowRequestCount || 0,
    totalRequests: item.totalRequests || 0
  }));
}

module.exports = {
  buildMatchFilter,
  getOverviewAnalytics,
  getFailureAnalytics,
  getPerformanceAnalytics,
  getServicesAnalytics,
  getErrorAnalytics,
  getLogsExplorer,
  getLogById,
  getTraceByRequestId,
  getEndpointAnalytics,
  getSlowEndpointsAnalytics
};
