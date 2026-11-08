const tintColorLight = '#059669'; // Emerald primary
const tintColorDark = '#34d399';

export const BrandColors = {
  primary: '#059669',
  primaryDark: '#047857',
  primaryLight: '#d1fae5',
  amber: '#d97706',
  amberLight: '#fef3c7',
  surface: '#ffffff',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  ok: '#10b981',
};

export default {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f8fafc',
    background: '#090d16',
    tint: tintColorDark,
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorDark,
  },
};
