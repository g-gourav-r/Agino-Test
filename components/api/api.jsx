export const GET = "get";
export const POST = "post";
export const PUT = "put";
export const DELETE = "delete";

const createApiCall =
  (url, method) =>
  (params = {}) => {
    let apiEndpoint = " https://zingapi.agino.tech/" + url;
    const { body, urlParams, pathVariables, headers = {} } = params;

    // Handle URL parameters
    if (urlParams) {
      apiEndpoint = `${apiEndpoint}?${new URLSearchParams(urlParams)}`;
    }

    // Handle path variables
    if (pathVariables) {
      apiEndpoint = Object.keys(pathVariables).reduce(
        (acc, curr) => acc.replace(`{${curr}}`, String(pathVariables[curr])),
        apiEndpoint
      );
    }

    // Check if the body is FormData (for file uploads) or JSON (for normal payloads)
    let isFormData = body instanceof FormData;

    return fetch(apiEndpoint, {
      method,
      headers: {
        // Only set Content-Type if the body is NOT FormData (FormData sets its own Content-Type)
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      // Convert body to JSON string if it's not FormData or undefined
      body:
        method !== GET ? (isFormData ? body : JSON.stringify(body)) : undefined,
    }).then(async (res) => {
      const resp = await res.json();
      if (res.ok) return Promise.resolve(resp);
      return Promise.reject(resp);
    });
  };

export default createApiCall;
