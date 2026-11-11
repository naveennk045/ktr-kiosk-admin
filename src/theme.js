import { theme } from 'antd';

/**
 * KTR brand tokens — the dark, glassy look of the kitchen display and token board
 * (kds-client/src/kds.css, tms-client/src/index.css).
 * Keep in sync with the CSS variables on :root in index.css. Use `brand` where a real colour value is
 * needed (chart strokes/fills, Ant props); use the CSS variables (var(--ktr-…)) in styles.
 */
export const brand = {
  paper: '#0b0a0a', // page background
  card: '#171313', // cards, sidebar, header
  ink: '#f7efe6', // main text
  ink2: '#d9cbbd',
  muted: '#b9aa9c',
  line: '#2f2826',
  peach: '#2a211d', // soft raised surface (tracks, hovers)
  orange: '#fa7700',
  orangeInk: '#ffb46b', // orange text on dark
  yellow: '#ffc41f',
  wine: '#803a4d',
  olive: '#6f8a2f',
  maroon: '#ff6b5e', // errors / falling
  ok: '#8fd16a',
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

const softShadow = '0 18px 40px -24px rgba(0, 0, 0, 0.7)';

/** Dark KTR theme: near-black warm background, dark glass cards, orange primary. */
export const ktrTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: brand.orange,
    colorInfo: brand.orange,
    colorSuccess: brand.ok,
    colorWarning: brand.yellow,
    colorError: brand.maroon,
    colorLink: brand.orangeInk,
    colorBgBase: brand.paper,
    colorBgContainer: brand.card,
    colorBgLayout: brand.paper,
    colorBgElevated: '#1f1917',
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
    boxShadowSecondary: '0 24px 60px -24px rgba(0, 0, 0, 0.8)',
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
      headerBg: '#1f1917',
      headerColor: brand.muted,
      headerSplitColor: 'transparent',
      rowHoverBg: 'rgba(250, 119, 0, 0.08)',
      borderColor: brand.line,
      headerBorderRadius: 12,
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemColor: brand.ink2,
      itemHoverColor: brand.ink,
      itemHoverBg: brand.peach,
      itemActiveBg: 'rgba(250, 119, 0, 0.18)',
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
      itemSelectedBg: brand.ink,
      itemSelectedColor: '#0b0a0a',
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
      colorBgElevated: '#171313',
    },
    Input: { activeShadow: '0 0 0 3px rgba(250, 119, 0, 0.16)' },
    Select: { optionSelectedBg: 'rgba(250, 119, 0, 0.18)' },
    Tooltip: {
      colorBgSpotlight: '#2a211d',
      colorTextLightSolid: brand.ink,
    },
  },
};

/** @deprecated old name, kept so existing imports keep working. */
export const modernTheme = ktrTheme;
