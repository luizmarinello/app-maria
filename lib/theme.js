export const c = {
  bg: '#EFEDEA',
  card: '#FFFFFF',
  pink: '#C97C8E',
  pinkSoft: '#F5E2E7',
  text: '#3D3733',
  muted: '#8C837C',
  green: '#3E9E6E',
  greenSoft: '#E3F3EA',
  line: '#E6E2DE',
  red: '#C0544F',
};

export const money = (n) =>
  'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const card = {
  backgroundColor: c.card,
  borderRadius: 16,
  padding: 16,
};
