export const colors = {
  primary: '#0D3B5E',
  greenDark: '#0A6E5C',
  accent: '#00C9A7',
  white: '#FFFFFF',

  background: '#F4F7FA',
  surface: '#FFFFFF',

  textPrimary: '#0D3B5E',
  textSecondary: '#6B7A99',
  textMuted: '#A0ADBF',

  border: '#E8EDF5',
  inputBg: '#F4F7FA',

  success: '#00C9A7',
  danger: '#E53E3E',
  dangerLight: '#FFF0F0',

  accentLight: '#E6FAF7',
  primaryLight: '#EBF0F7',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shadow = {
  sm: {
    shadowColor: '#0D3B5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#0D3B5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: '#0D3B5E', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: '#0D3B5E' },
  h3: { fontSize: 18, fontWeight: '600' as const, color: '#0D3B5E' },
  body: { fontSize: 15, fontWeight: '400' as const, color: '#0D3B5E' },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: '#6B7A99' },
  label: { fontSize: 12, fontWeight: '600' as const, color: '#6B7A99', textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  caption: { fontSize: 11, fontWeight: '400' as const, color: '#A0ADBF' },
};
