type ApiResponsePayload<T> = {
  status: number;
  response: string;
  message: string;
  data: T;
};

class ApiResponseBuilder {
  static build<T = any>(
    status: number,
    response: string,
    message: string,
    data: T = null as T,
  ): ApiResponsePayload<T> {
    return {
      status,
      response,
      message,
      data,
    };
  }

  static SUCCESS<T = any>(data: T = null as T, message: string = 'Success'): ApiResponsePayload<T> {
    return this.build(200, 'OK', message, data);
  }

  static CREATED<T = any>(data: T = null as T, message: string = 'Created'): ApiResponsePayload<T> {
    return this.build(201, 'Created', message, data);
  }

  static ACCEPTED<T = any>(data: T = null as T, message: string = 'Accepted'): ApiResponsePayload<T> {
    return this.build(202, 'Accepted', message, data);
  }

  static NO_CONTENT(message: string = 'No Content'): ApiResponsePayload<null> {
    return this.build(204, 'No Content', message, null);
  }

  static BAD_REQUEST(message: string = 'Bad Request'): ApiResponsePayload<null> {
    return this.build(400, 'Bad Request', message, null);
  }

  static UNAUTHORIZED(message: string = 'Unauthorized'): ApiResponsePayload<null> {
    return this.build(401, 'Unauthorized', message, null);
  }

  static FORBIDDEN(message: string = 'Forbidden'): ApiResponsePayload<null> {
    return this.build(403, 'Forbidden', message, null);
  }

  static NOT_FOUND(message: string = 'Not Found'): ApiResponsePayload<null> {
    return this.build(404, 'Not Found', message, null);
  }

  static CONFLICT(message: string = 'Conflict'): ApiResponsePayload<null> {
    return this.build(409, 'Conflict', message, null);
  }

  static INTERNAL_SERVER_ERROR(message: string = 'Internal Server Error'): ApiResponsePayload<null> {
    return this.build(500, 'Internal Server Error', message, null);
  }

  static ERROR<T = any>(
    message: string | string[],
    status: number = 500,
    data: T = null as T,
  ): ApiResponsePayload<T> {
    const statusText = this.getStatusText(status);
    const errorMessage = Array.isArray(message) ? message.join(', ') : message;
    return this.build(status, statusText, errorMessage, data);
  }

  private static getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      400: 'Bad Request',
      401: 'Unauthorized',
      402: 'Payment Required',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      406: 'Not Acceptable',
      407: 'Proxy Authentication Required',
      408: 'Request Timeout',
      409: 'Conflict',
      410: 'Gone',
      411: 'Length Required',
      412: 'Precondition Failed',
      413: 'Payload Too Large',
      414: 'URI Too Long',
      415: 'Unsupported Media Type',
      416: 'Range Not Satisfiable',
      417: 'Expectation Failed',
      418: "I'm a teapot",
      421: 'Misdirected Request',
      422: 'Unprocessable Entity',
      423: 'Locked',
      424: 'Failed Dependency',
      425: 'Too Early',
      426: 'Upgrade Required',
      428: 'Precondition Required',
      429: 'Too Many Requests',
      431: 'Request Header Fields Too Large',
      451: 'Unavailable For Legal Reasons',
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
      505: 'HTTP Version Not Supported',
      506: 'Variant Also Negotiates',
      507: 'Insufficient Storage',
      508: 'Loop Detected',
      510: 'Not Extended',
      511: 'Network Authentication Required',
    };
    return statusMap[status] || 'Error';
  }
}

export const ApiResponse = ApiResponseBuilder;
export type { ApiResponsePayload };
