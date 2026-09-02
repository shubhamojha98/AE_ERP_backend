import { Response } from 'express';

/**
 * Enterprise Base Controller
 * Provides standardized methods for API responses
 */
export class BaseController {
  
  /**
   * Send a standard success response
   */
  public ok<T>(res: Response, data: T, message: string = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Send a standard error response
   */
  public error(res: Response, message: string = 'Internal Server Error', statusCode: number = 500) {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  /**
   * Send a Forbidden response
   */
  public forbidden(res: Response, message: string = 'Access Denied') {
    return this.error(res, message, 403);
  }

  /**
   * Send a Validation error response
   */
  public validationError(res: Response, errors: any) {
    return res.status(422).json({
      success: false,
      message: 'Validation Failed',
      errors
    });
  }
}
