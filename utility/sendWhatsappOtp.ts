import axios from "axios";

export const sendWhatsappOtp = async (
  to: string,
  templateName: string,
  params: string[],
  language: string = "en_US"
) => {
  try {
    if (!to || !templateName) {
      throw new Error("to and templateName are required");
    }

    if (!params || params.length !== 1) {
      throw new Error("Template requires exactly 1 parameter");
    }

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: params[0] }],
          },
        ],
      },
    };

    const url = "https://graph.facebook.com/v22.0/785996341273524/messages";

    const TOKEN = process.env.WHATSAPP_TOKEN;

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return { success: true, data: response.data };

  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
};
