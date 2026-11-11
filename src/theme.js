import { theme } from 'antd';

/**
 * KTR brand tokens — the same palette as the self-order kiosk (kiosk-client/src/styles/ktr.css).
 * Keep in sync with the CSS variables on :root in index.css. Use `brand` where a real colour value is
 * needed (chart strokes/fills, Ant props); use the CSS variables (var(--ktr-…)) in styles.
 */
export const brand = {
  paper: '#fbf3ea',
  card: '#ffffff',
  ink: '#1b1513',
  ink2: '#4d3f37',
  muted: '#7a685c',
  line: '#ead9c7',
  peach: '#f6dfc6',
  orange: '#fa7700',
  orangeInk: '#c25700',
  yellow: '#ffc41f',
  wine: '#803a4d',
  olive: '#4d5e21',
  maroon: '#7d1919',
  ok: '#2f7d32',
};

/** Series colours for charts, in the order they should be used. */
export const chartColors = [
  brand.orange,
  brand.olive,
  brand.wine,
  brand.yellow,
  brand.maroon,
  brand.ok,
  brand.orangeInk,
  brand.muted,
  brand.peach,
];

export const fontDisplay = '"Unbounded", "Arial Black", system-ui, sans-serif';
export const fontBody =
  '"Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif';

const softShadow = '0 14px 32px -24px rgba(77, 40, 10, 0.45)';

/** Light KTR theme: warm paper background, white cards, orange primary. No dark surfaces. */
export const ktrTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: brand.orange,
    colorInfo: brand.orange,
    colorSuccess: brand.ok,
    colorWarning: '#d99a00',
    colorError: brand.maroon,
    colorLink: brand.orangeInk,
    colorBgBase: '#ffffff',
    colorBgContainer: brand.card,
    colorBgLayout: brand.paper,
    colorBgElevated: brand.card,
    colorText: brand.ink,
    colorTextSecondary: brand.muted,
    colorTextTertiary: brand.muted,
    colorTextHeading: brand.ink,
    colorBorder: brand.line,
    colorBorderSecondary: brand.line,
    colorSplit: brand.line,
    borderRadius: 14,
    fontFamily: fontBody,
    fontSize: 14,
    boxShadow: softShadow,
    boxShadowSecondary: '0 18px 40px -22px rgba(77, 40, 10, 0.45)',
  },
  components: {
    Layout: {
      bodyBg: brand.paper,
      siderBg: brand.card,
      headerBg: brand.card,
      headerColor: brand.ink,
      lightSiderBg: brand.card,
    },
    Card: {
      colorBgContainer: brand.card,
      colorBorderSecondary: brand.line,
      borderRadiusLG: 16,
      headerFontSize: 16,
    },
    Table: {
      headerBg: brand.paper,
      headerColor: brand.muted,
      headerSplitColor: 'transparent',
      rowHoverBg: '#fff8f0',
      borderColor: brand.line,
      headerBorderRadius: 12,
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemColor: brand.ink2,
      itemHoverColor: brand.ink,
      itemHoverBg: brand.paper,
      itemActiveBg: brand.peach,
      itemSelectedBg: brand.orange,
      itemSelectedColor: '#1d0e00',
      groupTitleColor: brand.muted,
      groupTitleFontSize: 11,
      itemBorderRadius: 12,
      itemHeight: 42,
      itemMarginInline: 0,
      activeBarBorderWidth: 0,
    },
    Button: {
      borderRadius: 12,
      controlHeight: 40,
      fontWeight: 700,
      primaryShadow: '0 10px 20px -12px rgba(250, 119, 0, 0.8)',
      defaultBorderColor: brand.line,
      defaultColor: brand.ink,
    },
    Segmented: {
      trackBg: brand.peach,
      itemSelectedBg: brand.card,
      itemSelectedColor: brand.ink,
      itemColor: brand.ink2,
    },
    Tabs: {
      inkBarColor: brand.orange,
      itemSelectedColor: brand.orangeInk,
      itemHoverColor: brand.orangeInk,
    },
    Statistic: {
      titleFontSize: 12,
    },
    Tag: {
      borderRadiusSM: 8,
    },
    Drawer: {
      colorBgElevated: brand.card,
    },
    Input: { activeShadow: '0 0 0 3px rgba(250, 119, 0, 0.16)' },
    Select: { optionSelectedBg: brand.peach },
    Tooltip: {
      colorBgSpotlight: brand.card,
      colorTextLightSolid: brand.ink,
    },
  },
};

/** @deprecated old name, kept so existing imports keep working. */
export const modernTheme = ktrTheme;
