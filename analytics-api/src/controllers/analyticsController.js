const analyticsService = require('../services/analyticsService');

exports.getOverview = async (req, res, next) => {
  try {
    const { range, service, from, to } = req.query;
    const data = await analyticsService.getOverviewAnalytics({ range, service, from, to });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getFailures = async (req, res, next) => {
  try {
    const { range, service, from, to, limit } = req.query;
    const data = await analyticsService.getFailureAnalytics({ range, service, from, to }, limit);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getPerformance = async (req, res, next) => {
  try {
    const { range, service, from, to } = req.query;
    const data = await analyticsService.getPerformanceAnalytics({ range, service, from, to });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getServices = async (req, res, next) => {
  try {
    const { range, service, from, to } = req.query;
    const data = await analyticsService.getServicesAnalytics({ range, service, from, to });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getErrors = async (req, res, next) => {
  try {
    const { range, service, from, to, limit } = req.query;
    const data = await analyticsService.getErrorAnalytics({ range, service, from, to }, limit);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    const { service, level, event, from, to, page, limit } = req.query;
    const data = await analyticsService.getLogsExplorer({
      service,
      level,
      event,
      from,
      to,
      page,
      limit
    });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await analyticsService.getLogById(id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrace = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const data = await analyticsService.getTraceByRequestId(requestId);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getEndpoints = async (req, res, next) => {
  try {
    const { range, service, from, to, limit } = req.query;
    const data = await analyticsService.getEndpointAnalytics({ range, service, from, to }, limit);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getSlowEndpoints = async (req, res, next) => {
  try {
    const { range, service, from, to, limit } = req.query;
    const data = await analyticsService.getSlowEndpointsAnalytics({ range, service, from, to }, limit);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
