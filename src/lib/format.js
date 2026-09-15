export const money = (n) =>
  'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const digits = (phone) => String(phone || '').replace(/\D/g, '');

/** Link do WhatsApp. Assume Brasil quando o número vem sem o 55. */
export const whatsapp = (phone) => {
  const d = digits(phone);
  if (d.length < 10) return null;
  return 'https://wa.me/' + (d.startsWith('55') && d.length >= 12 ? d : '55' + d);
};

export const tel = (phone) => (digits(phone).length >= 8 ? 'tel:' + digits(phone) : null);
