// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\emailBrevo.ts
import axios from "axios";
import { CONFIG } from "../config/config";

const BREVO_API_KEY = CONFIG.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface EmailParams {
  to: string;
  subject: string;
  otp: string;
  error: string;
}

export const sendOtpEmail = async ({ to, subject, otp }: EmailParams) => {
  console.log("its brevo");
  
  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: "JudgeXpert",
          email: "vivekv290100@gmail.com",
        },
        to: [{ email: to }],
        subject: subject,
        templateId: 2, 
        params: {
          otp: otp,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY!,
        },
      }
    );

    // console.log("0000000000", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP email");
  }
};
