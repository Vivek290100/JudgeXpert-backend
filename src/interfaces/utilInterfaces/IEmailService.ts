export interface IEmailService {
    sendOtpEmail(params: { to: string; subject: string; otp: string; error:any }): Promise<any>;
  }