// Turns any Axios failure into one sentence a planner can act on.
export default function getErrorMessage(error, fallback) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the EventSync server. Check that it is running and try again.';
  }
  return fallback;
}
