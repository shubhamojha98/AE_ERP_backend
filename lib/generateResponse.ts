import { Response } from "express"
import HttpStatus from "./httpStatus"

const genrateResponse = (res: Response, status: HttpStatus, message: string, data?: any, extra: any = {}) => {
    const isSuccess = status >= 200 && status < 300;
    res.status(status).json({
        status: isSuccess,
        message: message,
        data: data,
        timestamp: new Date().toISOString(),
        ...extra
    })
}

export default genrateResponse