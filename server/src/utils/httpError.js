// Creates an Error carrying an HTTP status; the central error handler reads statusCode.
export default function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
