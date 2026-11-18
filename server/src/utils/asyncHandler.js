// Wraps an async controller so rejected promises reach the central error handler.
// Instead of try/catch in every controller we write: export const x = asyncHandler(async (req, res) => { ... })
export default function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
