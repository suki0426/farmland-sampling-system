const FALLBACK_THEME_COLOR = '#0f172a'
const LEGACY_DEFAULTS = ['#1890ff', '#3f8ef7', '#2563eb', '#409eff']

export function normalizeHexColor (color) {
  const raw = (color || '').trim().replace('#', '')
  if (!raw) {
    return FALLBACK_THEME_COLOR
  }
  if (raw.length === 3) {
    return `#${raw.split('').map((char) => char + char).join('')}`.toLowerCase()
  }
  if (raw.length === 6) {
    return `#${raw}`.toLowerCase()
  }
  return FALLBACK_THEME_COLOR
}

export function resolveThemeColor (color) {
  const normalized = normalizeHexColor(color || FALLBACK_THEME_COLOR)
  if (!color || LEGACY_DEFAULTS.includes(normalized)) {
    return FALLBACK_THEME_COLOR
  }
  return normalized
}

export function hexToRgb (color) {
  const normalized = resolveThemeColor(color).slice(1)
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  }
}

export function mixHexColors (baseColor, mixColor, ratio = 0.5) {
  const base = hexToRgb(baseColor)
  const mix = hexToRgb(mixColor)
  const blend = (source, target) => Math.round(source * (1 - ratio) + target * ratio)
  const toHex = (value) => value.toString(16).padStart(2, '0')
  return `#${toHex(blend(base.r, mix.r))}${toHex(blend(base.g, mix.g))}${toHex(blend(base.b, mix.b))}`
}

export function hexToRgba (color, alpha) {
  const rgb = hexToRgb(color)
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

export function getCurrentThemeColor () {
  if (typeof window !== 'undefined' && window.getComputedStyle) {
    const cssTheme = window.getComputedStyle(document.documentElement).getPropertyValue('--defaultTheme').trim()
    if (cssTheme) {
      return resolveThemeColor(cssTheme)
    }
  }
  if (typeof localStorage !== 'undefined') {
    return resolveThemeColor(localStorage.getItem('defaultTheme'))
  }
  return FALLBACK_THEME_COLOR
}

export function createThemePalette (themeColor = getCurrentThemeColor()) {
  const primary = resolveThemeColor(themeColor)
  return {
    primary,
    primarySoft: mixHexColors(primary, '#ffffff', 0.28),
    primaryMuted: mixHexColors(primary, '#ffffff', 0.42),
    primaryDeep: mixHexColors(primary, '#020617', 0.14),
    primaryGlow: hexToRgba(primary, 0.2)
  }
}

export function createThemeStyleVars (themeColor = getCurrentThemeColor()) {
  const theme = resolveThemeColor(themeColor)
  const brandStart = mixHexColors(theme, '#0f172a', 0.72)
  const brandEnd = mixHexColors(theme, '#334155', 0.45)
  const activeBg = mixHexColors(theme, '#0f172a', 0.78)
  const activeLine = mixHexColors(theme, '#ffffff', 0.08)
  const themeLight = mixHexColors(theme, '#ffffff', 0.16)
  const themeDark = mixHexColors(theme, '#020617', 0.16)
  const themeTinge = hexToRgba(theme, 0.12)
  const buttonHover = mixHexColors(theme, '#ffffff', 0.14)
  const buttonActive = mixHexColors(theme, '#020617', 0.14)
  const buttonFocus = hexToRgba(theme, 0.18)
  const controlHoverBg = hexToRgba(theme, 0.07)
  const controlActiveBg = hexToRgba(theme, 0.12)

  return {
    '--defaultTheme': theme,
    '--ul-primary': theme,
    '--ul-brand-start': brandStart,
    '--ul-brand-end': brandEnd,
    '--ul-sidebar-active-bg': activeBg,
    '--ul-sidebar-active-line': activeLine,
    '--ul-sidebar-active-shadow': `0 0 0 2px ${hexToRgba(theme, 0.18)}`,
    '--vxe-ui-font-primary-color': theme,
    '--vxe-ui-font-primary-lighten-color': themeLight,
    '--vxe-ui-font-primary-darken-color': themeDark,
    '--vxe-ui-font-primary-tinge-color': themeTinge,
    '--vxe-ui-loading-color': theme,
    '--vxe-ui-loading-background-color': 'rgba(255, 255, 255, 0.72)',
    '--ul-button-hover': buttonHover,
    '--ul-button-active': buttonActive,
    '--ul-button-focus-shadow': `0 0 0 2px ${buttonFocus}`,
    '--ul-control-hover-bg': controlHoverBg,
    '--ul-control-active-bg': controlActiveBg
  }
}

export { FALLBACK_THEME_COLOR }
