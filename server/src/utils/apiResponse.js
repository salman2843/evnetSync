// Every API response uses the same shape: { success, data, message }.
export function sendSuccess(res, data, message, status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function sendCreated(res, data, message) {
  return sendSuccess(res, data, message, 201);
}

export function sendError(res, message, status = 400, data = null) {
  return res.status(status).json({ success: false, data, message });
}
