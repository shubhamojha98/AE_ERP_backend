import { Request, Response } from 'express';
import { sendWhatsappOtp } from '../../utility/sendWhatsappOtp';

/**
 * Controller for handling external WhatsApp integrations.
 */
export const sendOtpHandler = async (req: Request, res: Response) => {
    try {
        const { to, templateName, params, language } = req.body;

        const result = await sendWhatsappOtp(to, templateName, params, language);

        if (!result.success) {
            return res.status(500).json(result);
        }

        return res.json(result);
    } catch (err: any) {
        console.error("[Whatsapp Controller] Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
