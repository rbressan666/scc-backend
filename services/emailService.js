import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import pool from '../config/database.js';

function getBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = getBoolean(process.env.SMTP_SECURE, port === 465);
  const connectionTimeout = parseInt(process.env.SMTP_CONN_TIMEOUT || '15000', 10);
  const greetingTimeout = parseInt(process.env.SMTP_GREET_TIMEOUT || '15000', 10);
  const socketTimeout = parseInt(process.env.SMTP_SOCKET_TIMEOUT || '20000', 10);
  const requireTLS = getBoolean(process.env.SMTP_REQUIRE_TLS, !secure && port === 587);
  const familyEnv = process.env.SMTP_FAMILY; // '4' para IPv4, '6' para IPv6
  const family = familyEnv === '4' ? 4 : familyEnv === '6' ? 6 : undefined;

  if (!host || !user || !pass) {
    console.warn('[emailService] SMTP não configurado (defina SMTP_HOST, SMTP_USER, SMTP_PASS). Tentando SendGrid se disponível.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    family,
    tls: { servername: host, minVersion: 'TLSv1.2' },
  });
  return transporter;
}

export async function getAdminEmails() {
  try {
    const result = await pool.query(
      `SELECT email FROM usuarios WHERE perfil = 'admin' AND ativo = true`
    );
    const emails = Array.from(new Set(result.rows.map(r => r.email).filter(Boolean)));
    if (process.env.EMAIL_DEBUG === 'true') {
      console.log('[emailService] Admins encontrados:', emails);
    }
    return emails;
  } catch (err) {
    console.error('[emailService] Erro ao buscar emails de admins:', err?.message || err);
    return [];
  }
}

export async function sendMail({ to, subject, html, text }) {
  const fromName = process.env.MAIL_FROM_NAME || 'SCC Notificações';
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;

  const trySendgrid = async () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return { skipped: true };
    try {
      sgMail.setApiKey(apiKey);
      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: { email: fromEmail, name: fromName },
        subject,
        html,
        text,
      };
      if (process.env.EMAIL_DEBUG === 'true') {
        console.log('[emailService] Enviando via SendGrid API', { to: msg.to, subject: msg.subject });
      }
      const resp = await sgMail.send(msg);
      return { success: true, provider: 'sendgrid', response: Array.isArray(resp) ? resp[0]?.statusCode : undefined };
    } catch (err) {
      console.error('[emailService] SendGrid falhou:', err?.message || err);
      if (err?.response?.body) {
        console.error('[emailService] SendGrid response body:', JSON.stringify(err.response.body));
      }
      return { success: false, provider: 'sendgrid', error: err?.message || String(err) };
    }
  };

  const tx = getTransporter();
  if (!tx) return await trySendgrid();


  try {
    const mail = {
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html,
      text,
    };
    if (process.env.EMAIL_DEBUG === 'true') {
      console.log('[emailService] Enviando email via SMTP:', {
        host: tx.options.host,
        port: tx.options.port,
        secure: tx.options.secure,
        to: mail.to,
        subject: mail.subject,
      });
    }
    const info = await tx.sendMail(mail);
    return { success: true, provider: 'smtp', messageId: info.messageId };
  } catch (err) {
    console.error('[emailService] Falha ao enviar email:', err?.message || err);
    const fb = await trySendgrid();
    if (fb?.success || fb?.skipped) return fb;
    return { success: false, provider: 'smtp', error: err?.message || String(err) };
  }
}

export async function notifyAdminsOnLogin({ user, req }) {
  const to = await getAdminEmails();
  if (!to.length) return { skipped: true };

  // Formatar horário na timezone configurada (padrão: America/Sao_Paulo)
  const appTz = process.env.APP_TZ || process.env.TIMEZONE || process.env.TZ || 'America/Sao_Paulo';
  const when = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: appTz,
  }).format(new Date());
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '-';
  const ua = req.headers['user-agent'] || '-';

  const subject = `SCC: Login realizado por ${user.nome_completo || user.email}`;
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222">
      <h2 style="margin:0 0 8px">Novo login no SCC</h2>
      <p><strong>Usuário:</strong> ${user.nome_completo || '-'} (${user.email})</p>
      <p><strong>Perfil:</strong> ${user.perfil || '-'}</p>
      <p><strong>Data/Hora (${appTz}):</strong> ${when}</p>
      <p><strong>IP:</strong> ${ip}</p>
      <p><strong>User-Agent:</strong> ${ua}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <p style="color:#666">Este é um email automático de notificação de segurança.</p>
    </div>
  `;
  const text = `Novo login no SCC\nUsuario: ${user.nome_completo || '-'} (${user.email})\nPerfil: ${user.perfil || '-'}\nData/Hora (${appTz}): ${when}\nIP: ${ip}\nUser-Agent: ${ua}`;

  return sendMail({ to, subject, html, text });
}

export async function verifySMTP() {
  const tx = getTransporter();
  if (!tx) return { configured: false, message: 'SMTP não configurado' };
  try {
    if (process.env.EMAIL_DEBUG === 'true') {
      console.log('[emailService] Verificando transporte SMTP...', {
        host: tx.options.host,
        port: tx.options.port,
        secure: tx.options.secure,
        requireTLS: tx.options.requireTLS,
      });
    }
    const ok = await tx.verify();
    return { configured: true, reachable: ok === true };
  } catch (err) {
    console.error('[emailService] SMTP verify falhou:', err?.message || err);
    return { configured: true, reachable: false, error: err?.message || String(err) };
  }
}
