import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { subject, text, html, rawData } = await req.json();

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'no-reply@rbatransporte.com.br';
    const to = 'comercial@rbatransporte.com.br';

    // 1. If SMTP credentials are fully configured, send via SMTP
    if (host && user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: `RBA Website <${from}>`,
        to,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("E-mail enviado via SMTP: %s", info.messageId);
      return NextResponse.json({ success: true, method: 'smtp', messageId: info.messageId });
    }

    // 2. Fallback: Send via FormSubmit API (zero-configuration autonomous delivery)
    console.log("SMTP não configurado. Usando fallback autônomo (FormSubmit) para " + to);

    const payload = {
      _subject: subject,
      _replyto: rawData?.['E-mail'] || rawData?.['email'] || '',
      ...rawData
    };

    const res = await fetch(`https://formsubmit.co/ajax/${to}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Falha ao processar envio pelo canal autônomo.');
      }
    } else {
      const text = await res.text();
      if (!res.ok) {
        if (text.includes('activate FormSubmit') || text.includes('Activation') || text.includes('confirm')) {
          throw new Error('O e-mail comercial@rbatransporte.com.br ainda não foi confirmado/ativado no FormSubmit. Por favor, verifique a caixa de entrada para ativá-lo.');
        }
        throw new Error('O servidor de fallback (FormSubmit) retornou uma página HTML em vez de JSON.');
      }
    }

    return NextResponse.json({ success: true, method: 'autonomous' });
  } catch (error: any) {
    console.error("Erro ao processar envio de e-mail:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao enviar e-mail.' }, 
      { status: 500 }
    );
  }
}
