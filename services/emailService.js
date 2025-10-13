import nodemailer from 'nodemailer';
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

  if (!host || !user || !pass) {
    console.warn('[emailService] SMTP não configurado (defina SMTP_HOST, SMTP_USER, SMTP_PASS). Emails serão ignorados.');
    return null;
  }

  transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return transporter;
}

export async function getAdminEmails() {
  try {
    const result = await pool.query(
      `SELECT email FROM usuarios WHERE perfil = 'admin' AND ativo = true`
    );
    return result.rows.map(r => r.email).filter(Boolean);
  } catch (err) {
    console.error('[emailService] Erro ao buscar emails de admins:', err?.message || err);
    return [];
  }
}

export async function sendMail({ to, subject, html, text }) {
  const tx = getTransporter();
  if (!tx) return { skipped: true };

  const fromName = process.env.MAIL_FROM_NAME || 'SCC Notificações';
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;

  try {
    const info = await tx.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html,
      text,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[emailService] Falha ao enviar email:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function notifyAdminsOnLogin({ user, req }) {
  const to = await getAdminEmails();
  if (!to.length) return { skipped: true };

  const when = new Date().toLocaleString('pt-BR');
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '-';
  const ua = req.headers['user-agent'] || '-';

  const subject = `SCC: Login realizado por ${user.nome_completo || user.email}`;
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222">
      <h2 style="margin:0 0 8px">Novo login no SCC</h2>
      <p><strong>Usuário:</strong> ${user.nome_completo || '-'} (${user.email})</p>
      <p><strong>Perfil:</strong> ${user.perfil || '-'}</p>
      <p><strong>Data/Hora:</strong> ${when}</p>
      <p><strong>IP:</strong> ${ip}</p>
      <p><strong>User-Agent:</strong> ${ua}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <p style="color:#666">Este é um email automático de notificação de segurança.</p>
    </div>
  `;
  const text = `Novo login no SCC\nUsuario: ${user.nome_completo || '-'} (${user.email})\nPerfil: ${user.perfil || '-'}\nData/Hora: ${when}\nIP: ${ip}\nUser-Agent: ${ua}`;

  return sendMail({ to, subject, html, text });
}
