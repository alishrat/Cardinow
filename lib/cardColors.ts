import { toUUID, PRESET_TEMPLATE_SCHEMAS } from './directus';

export interface TemplateDefaultColors {
  primary: string;
  secondary: string;
  background: string;
  card_bg: string;
  text: string;
  name_color?: string;
  job_color?: string;
  company_color?: string;
  bio_color?: string;
  text_secondary?: string;
  box_bg?: string;
  btn_bg?: string;
  btn_text?: string;
  border_color?: string;
}

export interface CardColorPalette {
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  cardBgColor: string;
  textCol: string;
  nameColor: string;
  jobColor: string;
  companyColor: string;
  bioColor: string;
  textSecondaryColor: string;
  boxBgColor: string;
  btnBgColor: string;
  btnTextColor: string;
  customBorderColor: string;
}

export function getTemplateDefaultColors(templateId?: string | null, templatesList: any[] = []): TemplateDefaultColors {
  if (!templateId) {
    return {
      primary: '#2563eb',
      secondary: '#3b82f6',
      background: '#f1f5f9',
      card_bg: '#ffffff',
      text: '#1e293b',
      name_color: '#1e293b',
      job_color: '#2563eb',
      company_color: '#64748b',
      bio_color: '#334155',
      text_secondary: '#64748b',
      box_bg: '#f8fafc',
      btn_bg: '#2563eb',
      btn_text: '#ffffff',
      border_color: '#e2e8f0',
    };
  }

  const cleanId = templateId.toLowerCase();
  const cleanUuid = toUUID(templateId);

  // 1. Classic (temp-1)
  if (cleanId === 'temp-1' || cleanId === 'classic' || cleanUuid === '11111111-1111-1111-1111-111111111111') {
    return {
      primary: '#2563eb',
      secondary: '#3b82f6',
      background: '#f1f5f9',
      card_bg: '#ffffff',
      text: '#1e293b',
      name_color: '#1e293b',
      job_color: '#2563eb',
      company_color: '#64748b',
      bio_color: '#334155',
      text_secondary: '#64748b',
      box_bg: '#f8fafc',
      btn_bg: '#2563eb',
      btn_text: '#ffffff',
      border_color: '#e2e8f0',
    };
  }

  // 2. Bento Grid (temp-2)
  if (cleanId === 'temp-2' || cleanId === 'bento' || cleanUuid === '22222222-2222-2222-2222-222222222222') {
    return {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#0f172a',
      card_bg: '#1e293b',
      text: '#f8fafc',
      name_color: '#ffffff',
      job_color: '#818cf8',
      company_color: '#94a3b8',
      bio_color: '#cbd5e1',
      text_secondary: '#94a3b8',
      box_bg: 'rgba(15, 23, 42, 0.5)',
      btn_bg: '#6366f1',
      btn_text: '#ffffff',
      border_color: '#334155',
    };
  }

  // 3. Content Creator / Bio-link (temp-3)
  if (cleanId === 'temp-3' || cleanId === 'content-creator' || cleanUuid === '33333333-3333-3333-3333-333333333333') {
    return {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      background: '#09090b',
      card_bg: '#18181b',
      text: '#fafafa',
      name_color: '#ffffff',
      job_color: '#f472b6',
      company_color: '#a1a1aa',
      bio_color: '#e4e4e7',
      text_secondary: '#a1a1aa',
      box_bg: 'rgba(39, 39, 42, 0.5)',
      btn_bg: '#ec4899',
      btn_text: '#ffffff',
      border_color: '#3f3f46',
    };
  }

  // 4. Neon Glass (temp-4)
  if (cleanId === 'temp-4' || cleanId === 'neon-glass' || cleanUuid === '44444444-4444-4444-4444-444444444444') {
    return {
      primary: '#06b6d4',
      secondary: '#3b82f6',
      background: '#050814',
      card_bg: '#0f172a',
      text: '#ffffff',
      name_color: '#ffffff',
      job_color: '#06b6d4',
      company_color: '#38bdf8',
      bio_color: '#cbd5e1',
      text_secondary: '#94a3b8',
      box_bg: '#1e293b',
      btn_bg: '#06b6d4',
      btn_text: '#050814',
      border_color: '#06b6d4',
    };
  }

  // 5. Minimal (temp-5)
  if (cleanId === 'temp-5' || cleanId === 'minimal' || cleanUuid === '55555555-5555-5555-5555-555555555555') {
    return {
      primary: '#0f172a',
      secondary: '#475569',
      background: '#f8fafc',
      card_bg: '#ffffff',
      text: '#0f172a',
      name_color: '#0f172a',
      job_color: '#334155',
      company_color: '#64748b',
      bio_color: '#334155',
      text_secondary: '#64748b',
      box_bg: '#f1f5f9',
      btn_bg: '#0f172a',
      btn_text: '#ffffff',
      border_color: '#e2e8f0',
    };
  }

  // 6. Luxury Dark (temp-6)
  if (cleanId === 'temp-6' || cleanId === 'luxury-dark' || cleanUuid === '66666666-6666-6666-6666-666666666666') {
    return {
      primary: '#f59e0b',
      secondary: '#d97706',
      background: '#0c0a09',
      card_bg: '#1c1917',
      text: '#fef3c7',
      name_color: '#fef3c7',
      job_color: '#f59e0b',
      company_color: '#d97706',
      bio_color: '#e7e5e4',
      text_secondary: '#a8a29e',
      box_bg: '#292524',
      btn_bg: '#f59e0b',
      btn_text: '#1c1917',
      border_color: '#78350f',
    };
  }

  // Check if it's a dynamic template or preset template
  const allTemplates = [...templatesList, ...PRESET_TEMPLATE_SCHEMAS];
  const found = allTemplates.find(
    (t) =>
      (t.id && cleanUuid && toUUID(t.id) === cleanUuid) ||
      t.id === templateId ||
      t.slug === templateId ||
      (t.slug && t.slug.toLowerCase() === cleanId)
  );

  if (found) {
    let tSchema: any = found.schema || found.schema_json || {};
    if (typeof tSchema === 'string') {
      try { tSchema = JSON.parse(tSchema); } catch { tSchema = {}; }
    }
    const isDarkTheme = ['dark', 'neon', 'cyber', 'gold', 'glass'].includes(tSchema.theme || '') || tSchema.theme === 'dark';
    const dbColors = tSchema.colors || found.theme_colors || found.default_colors || {};

    if (Object.keys(dbColors).length > 0) {
      const pColor = dbColors.primary || '#2563eb';
      const sColor = dbColors.secondary || '#3b82f6';
      const bColor = dbColors.background || (isDarkTheme ? '#090d16' : '#f1f5f9');
      const txtColor = dbColors.text || (isDarkTheme ? '#f8fafc' : '#1e293b');
      const cBgColor = dbColors.card_bg || (isDarkTheme ? '#0f172a' : '#ffffff');
      const txtSec = dbColors.text_secondary || (isDarkTheme ? '#94a3b8' : '#64748b');

      return {
        primary: pColor,
        secondary: sColor,
        background: bColor,
        card_bg: cBgColor,
        text: txtColor,
        name_color: dbColors.name_color || txtColor,
        job_color: dbColors.job_color || pColor,
        company_color: dbColors.company_color || txtSec,
        bio_color: dbColors.bio_color || txtColor,
        text_secondary: txtSec,
        box_bg: dbColors.box_bg || (isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
        btn_bg: dbColors.btn_bg || pColor,
        btn_text: dbColors.btn_text || (isDarkTheme && pColor === '#06b6d4' ? '#050814' : '#ffffff'),
        border_color: dbColors.border_color || (isDarkTheme ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
      };
    }
  }

  // Fallback to Classic default
  return {
    primary: '#2563eb',
    secondary: '#3b82f6',
    background: '#f1f5f9',
    card_bg: '#ffffff',
    text: '#1e293b',
    name_color: '#1e293b',
    job_color: '#2563eb',
    company_color: '#64748b',
    bio_color: '#334155',
    text_secondary: '#64748b',
    box_bg: '#f8fafc',
    btn_bg: '#2563eb',
    btn_text: '#ffffff',
    border_color: '#e2e8f0',
  };
}

export function getResolvedCardColors(
  customColors?: Record<string, string | undefined> | null,
  templateId?: string | null,
  templatesList: any[] = []
): CardColorPalette {
  const tmplDefaults = getTemplateDefaultColors(templateId, templatesList);
  const c = customColors || {};

  const primaryColor = c.primary?.trim() ? c.primary : tmplDefaults.primary;
  const secondaryColor = c.secondary?.trim() ? c.secondary : tmplDefaults.secondary;
  const bgColor = c.background?.trim() ? c.background : tmplDefaults.background;
  const textCol = c.text?.trim() ? c.text : tmplDefaults.text;
  const cardBgColor = c.card_bg?.trim() ? c.card_bg : tmplDefaults.card_bg;

  const nameColor = c.name_color?.trim() ? c.name_color : (tmplDefaults.name_color || textCol);
  const jobColor = c.job_color?.trim() ? c.job_color : (tmplDefaults.job_color || primaryColor);
  const companyColor = c.company_color?.trim()
    ? c.company_color
    : (tmplDefaults.company_color || c.text_secondary || tmplDefaults.text_secondary || textCol);
  const bioColor = c.bio_color?.trim() ? c.bio_color : (tmplDefaults.bio_color || textCol);
  const textSecondaryColor = c.text_secondary?.trim() ? c.text_secondary : (tmplDefaults.text_secondary || '#64748b');
  const boxBgColor = c.box_bg?.trim() ? c.box_bg : (tmplDefaults.box_bg || 'rgba(0, 0, 0, 0.03)');
  const btnBgColor = c.btn_bg?.trim() ? c.btn_bg : (tmplDefaults.btn_bg || primaryColor);
  const btnTextColor = c.btn_text?.trim() ? c.btn_text : (tmplDefaults.btn_text || '#ffffff');
  const customBorderColor = c.border_color?.trim() ? c.border_color : (tmplDefaults.border_color || 'rgba(0, 0, 0, 0.08)');

  return {
    primaryColor,
    secondaryColor,
    bgColor,
    cardBgColor,
    textCol,
    nameColor,
    jobColor,
    companyColor,
    bioColor,
    textSecondaryColor,
    boxBgColor,
    btnBgColor,
    btnTextColor,
    customBorderColor,
  };
}
