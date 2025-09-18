
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@schedina.app';
  const fromName = process.env.FROM_NAME || 'Schedina';

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set');
    throw new Error('Email service not configured');
  }

  console.log(`Attempting to send email to: ${to}, from: ${fromName} <${fromEmail}>`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Email utility error:', error);
    throw error;
  }
}
