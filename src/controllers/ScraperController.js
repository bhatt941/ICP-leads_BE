const ScraperService = require('../services/ScraperService');
const response = require('../utils/response');

function emitScrapingEvent(req, event, payload) {
  const io = req.app?.get('io');
  if (io && req.user?._id) {
    io.to(`user:${String(req.user._id)}`).emit(event, payload);
  }
}

async function list(req, res) {
  try {
    const result = await ScraperService.listSessions(req.user?._id, req.query || {});
    return response.success(res, result.data, 'Scraping sessions retrieved', 200, result.pagination);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function start(req, res) {
  try {
    const io = req.app?.get('io');
    const result = await ScraperService.startSession(req.user?._id, req.body || {}, io);
    emitScrapingEvent(req, 'scraping:update', { type: 'started', session: result.session, status: result.status });
    return response.success(res, result, 'Scraping started', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function pause(req, res) {
  try {
    const result = await ScraperService.pauseSession(req.body?.sessionId || req.params?.sessionId);
    emitScrapingEvent(req, 'scraping:update', { type: 'paused', session: result });
    return response.success(res, result, 'Scraping paused');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function resume(req, res) {
  try {
    const result = await ScraperService.resumeSession(req.body?.sessionId || req.params?.sessionId);
    emitScrapingEvent(req, 'scraping:update', { type: 'resumed', session: result });
    return response.success(res, result, 'Scraping resumed');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function stop(req, res) {
  try {
    const result = await ScraperService.stopSession(req.body?.sessionId || req.params?.sessionId, { force: Boolean(req.body?.force) });
    emitScrapingEvent(req, 'scraping:update', { type: 'stopped', session: result });
    return response.success(res, result, 'Scraping stopped');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function status(req, res) {
  try {
    const result = await ScraperService.getStatus(req.body?.sessionId || req.params?.sessionId);
    return response.success(res, result, 'Scraping status retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function clearAll(req, res) {
  try {
    const result = await ScraperService.clearAllSessions(req.user?._id);
    return response.success(res, result, 'All scraping sessions cleared');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function remove(req, res) {
  try {
    const result = await ScraperService.deleteSession(req.params.id);
    return response.success(res, result, 'Scraping session deleted');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function streamProgress(req, res) {
  try {
    const userId = String(req.user?._id);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    const onUpdate = (event) => {
      if (event.userId === userId) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    };

    ScraperService.progressEmitter.on('update', onUpdate);

    req.on('close', () => {
      ScraperService.progressEmitter.off('update', onUpdate);
    });
  } catch (error) {
    console.error('SSE Stream error:', error);
  }
}

module.exports = {
  list,
  pause,
  resume,
  start,
  status,
  stop,
  clearAll,
  remove,
  streamProgress
};
