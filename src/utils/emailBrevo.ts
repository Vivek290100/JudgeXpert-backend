// utils/emailBrevo.ts
import axios from "axios";
import { IEmailService } from "../interfaces/utilInterfaces/IEmailService";

class BrevoEmailService implements IEmailService {
  private readonly apiKey: string;
  private readonly apiUrl: string = "https://api.brevo.com/v3/smtp/email";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendOtpEmail({ to, subject, otp }: { to: string; subject: string; otp: string }): Promise<any> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          sender: {
            name: "JudgeXpert",
            email: "vivekv290100@gmail.com",
          },
          to: [{ email: to }],
          subject,
          templateId: 2,
          params: {
            otp,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": this.apiKey,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send OTP email");
    }
  }
}

export default BrevoEmailService;