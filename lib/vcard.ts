import { Card } from './directus';

function formatUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function formatInstagram(val: string | null | undefined): { url: string; handle: string } | null {
  if (!val || typeof val !== 'string') return null;
  let clean = val.trim().replace(/^@/, '');
  if (!clean) return null;
  if (clean.includes('instagram.com/')) {
    const parts = clean.split('instagram.com/');
    const handle = parts[1]?.split('/')[0]?.split('?')[0] || '';
    const url = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    return { url, handle: handle || clean };
  }
  return { url: `https://instagram.com/${clean}`, handle: clean };
}

function formatTelegram(val: string | null | undefined): { url: string; handle: string } | null {
  if (!val || typeof val !== 'string') return null;
  let clean = val.trim().replace(/^@/, '');
  if (!clean) return null;
  if (clean.includes('t.me/')) {
    const parts = clean.split('t.me/');
    const handle = parts[1]?.split('/')[0]?.split('?')[0] || '';
    const url = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    return { url, handle: handle || clean };
  }
  return { url: `https://t.me/${clean}`, handle: clean };
}

function formatTwitter(val: string | null | undefined): { url: string; handle: string } | null {
  if (!val || typeof val !== 'string') return null;
  let clean = val.trim().replace(/^@/, '');
  if (!clean) return null;
  if (clean.includes('x.com/') || clean.includes('twitter.com/')) {
    const url = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    const handle = clean.replace(/^https?:\/\/(?:x|twitter)\.com\//i, '').split('/')[0] || '';
    return { url, handle: handle || clean };
  }
  return { url: `https://x.com/${clean}`, handle: clean };
}

function formatLinkedin(val: string | null | undefined): { url: string; handle: string } | null {
  if (!val || typeof val !== 'string') return null;
  let clean = val.trim();
  if (!clean) return null;
  if (clean.includes('linkedin.com/')) {
    const url = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    return { url, handle: clean };
  }
  return { url: `https://linkedin.com/in/${clean.replace(/^in\//, '')}`, handle: clean };
}

function formatWhatsapp(val: string | null | undefined): { url: string; phone: string } | null {
  if (!val || typeof val !== 'string') return null;
  let clean = val.trim();
  if (!clean) return null;
  if (clean.includes('wa.me/')) {
    const url = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    return { url, phone: clean };
  }
  const numeric = clean.replace(/[^\d]/g, '');
  if (numeric) {
    let intl = numeric;
    if (intl.startsWith('0')) intl = '98' + intl.substring(1);
    return { url: `https://wa.me/${intl}`, phone: clean };
  }
  return null;
}

export function createVCardString(card: Card): string {
  if (!card) return '';
  const { 
    phone, mobile, extra_phones, whatsapp, telegram, instagram, linkedin, twitter, website, email 
  } = card.social_links || {};
  
  const phoneNumbers: { number: string; type: string }[] = [];

  // 1. Mobile Phone Number
  if (mobile && typeof mobile === 'string' && mobile.trim()) {
    phoneNumbers.push({ number: mobile.trim(), type: 'CELL,VOICE' });
  }

  // 2. Fixed/Landline Work Phone Number
  if (phone && typeof phone === 'string' && phone.trim()) {
    const cleanPhone = phone.trim();
    if (!phoneNumbers.some(p => p.number === cleanPhone)) {
      phoneNumbers.push({ number: cleanPhone, type: 'WORK,VOICE' });
    }
  }

  // 3. WhatsApp Phone Number (if distinct and numeric)
  if (whatsapp && typeof whatsapp === 'string' && whatsapp.trim()) {
    const cleanWa = whatsapp.trim();
    if (/^[\d+\s()-]+$/.test(cleanWa) && !phoneNumbers.some(p => p.number === cleanWa)) {
      phoneNumbers.push({ number: cleanWa, type: 'CELL,MSG' });
    }
  }

  // 4. Additional Extra Phone Numbers
  if (extra_phones) {
    let list: string[] = [];
    if (Array.isArray(extra_phones)) {
      list = extra_phones;
    } else if (typeof extra_phones === 'string') {
      list = (extra_phones as string).split(/[\n,;]+/);
    }
    list.forEach((p) => {
      const clean = p ? String(p).trim() : '';
      if (clean && !phoneNumbers.some(item => item.number === clean)) {
        phoneNumbers.push({ number: clean, type: 'OTHER,VOICE' });
      }
    });
  }

  const firstName = card.first_name || '';
  const lastName = card.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'مخاطب مگاکارت';

  const telLines = phoneNumbers.map(p => `TEL;TYPE=${p.type}:${p.number}`);

  // Base URL for digital card link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://megacard.ir';
  const cardDigitalUrl = card.slug ? `${baseUrl}/${card.slug}` : '';

  // Process social links
  const instaObj = formatInstagram(instagram);
  const tgObj = formatTelegram(telegram);
  const twObj = formatTwitter(twitter);
  const liObj = formatLinkedin(linkedin);
  const waObj = formatWhatsapp(whatsapp);
  const webUrl = formatUrl(website);

  // Process map & navigation links
  const googlemapUrl = formatUrl(card.googlemap);
  const neshanUrl = formatUrl(card.neshan);
  const baladUrl = formatUrl(card.balad);
  const wazeUrl = formatUrl(card.waze);

  // Build URL and X-SOCIALPROFILE vCard attributes
  const urlLines: string[] = [];
  const socialLines: string[] = [];
  const linkSummaryLines: string[] = [];

  // MegaCard Digital Card Link
  if (cardDigitalUrl) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=کارت دیجیتال (MegaCard):${cardDigitalUrl}`);
    linkSummaryLines.push(`• کارت دیجیتال: ${cardDigitalUrl}`);
  }

  // Main Website
  if (webUrl) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=وب‌سایت (Website):${webUrl}`);
    linkSummaryLines.push(`• وب‌سایت: ${webUrl}`);
  }

  // Instagram
  if (instaObj) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=اینستاگرام (Instagram):${instaObj.url}`);
    socialLines.push(`X-SOCIALPROFILE;TYPE=instagram;x-user=${instaObj.handle}:${instaObj.url}`);
    linkSummaryLines.push(`• اینستاگرام: ${instaObj.url}`);
  }

  // Telegram
  if (tgObj) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=تلگرام (Telegram):${tgObj.url}`);
    socialLines.push(`X-SOCIALPROFILE;TYPE=telegram;x-user=${tgObj.handle}:${tgObj.url}`);
    linkSummaryLines.push(`• تلگرام: ${tgObj.url}`);
  }

  // LinkedIn
  if (liObj) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=لینکدین (LinkedIn):${liObj.url}`);
    socialLines.push(`X-SOCIALPROFILE;TYPE=linkedin:${liObj.url}`);
    linkSummaryLines.push(`• لینکدین: ${liObj.url}`);
  }

  // Twitter / X
  if (twObj) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=توییتر (X):${twObj.url}`);
    socialLines.push(`X-SOCIALPROFILE;TYPE=twitter:${twObj.url}`);
    linkSummaryLines.push(`• توییتر (X): ${twObj.url}`);
  }

  // WhatsApp
  if (waObj) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=واتساپ (WhatsApp):${waObj.url}`);
    socialLines.push(`X-SOCIALPROFILE;TYPE=whatsapp:${waObj.url}`);
    linkSummaryLines.push(`• واتساپ: ${waObj.url}`);
  }

  // Custom Buttons / Extra Links
  if (Array.isArray(card.custom_buttons)) {
    card.custom_buttons.forEach((btn, idx) => {
      if (btn && btn.url) {
        const btnUrl = formatUrl(btn.url);
        if (btnUrl) {
          const title = (btn.label || `لینک سفارشی ${idx + 1}`).trim();
          urlLines.push(`URL;CHARSET=UTF-8;TYPE=${title}:${btnUrl}`);
          linkSummaryLines.push(`• ${title}: ${btnUrl}`);
        }
      }
    });
  }

  // Navigation Links
  if (googlemapUrl) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=گوگل مپ (Google Maps):${googlemapUrl}`);
    linkSummaryLines.push(`• گوگل مپ: ${googlemapUrl}`);
  }
  if (neshanUrl) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=مسیریاب نشان (Neshan):${neshanUrl}`);
    linkSummaryLines.push(`• نشان: ${neshanUrl}`);
  }
  if (baladUrl) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=مسیریاب بلد (Balad):${baladUrl}`);
    linkSummaryLines.push(`• بلد: ${baladUrl}`);
  }
  if (wazeUrl) {
    urlLines.push(`URL;CHARSET=UTF-8;TYPE=مسیریاب ویز (Waze):${wazeUrl}`);
    linkSummaryLines.push(`• ویز: ${wazeUrl}`);
  }

  // Construct structured Note
  const noteSections: string[] = [];

  if (card.bio && card.bio.trim()) {
    noteSections.push(`📝 بیوگرافی:\n${card.bio.trim()}`);
  }

  const bankLines: string[] = [];
  if (card.bank_card && card.bank_card.trim()) {
    bankLines.push(`• شماره کارت: ${card.bank_card.trim()}`);
  }
  if (card.bank_account && card.bank_account.trim()) {
    bankLines.push(`• شماره حساب: ${card.bank_account.trim()}`);
  }
  if (card.bank_shaba && card.bank_shaba.trim()) {
    bankLines.push(`• شماره شبا: ${card.bank_shaba.trim()}`);
  }
  if (bankLines.length > 0) {
    noteSections.push(`💳 اطلاعات بانکی:\n${bankLines.join('\n')}`);
  }

  if (linkSummaryLines.length > 0) {
    noteSections.push(`🔗 لینک‌ها و شبکه‌های اجتماعی:\n${linkSummaryLines.join('\n')}`);
  }

  const fullNoteText = noteSections.join('\n\n');

  const vCardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${fullName}`,
    `N;CHARSET=UTF-8:${lastName};${firstName};;;`,
    card.company ? `ORG;CHARSET=UTF-8:${card.company}` : '',
    card.job_title ? `TITLE;CHARSET=UTF-8:${card.job_title}` : '',
    ...telLines,
    email ? `EMAIL;TYPE=PREF,INTERNET:${email}` : '',
    ...urlLines,
    ...socialLines,
    card.address ? `ADR;TYPE=WORK;CHARSET=UTF-8:;;${card.address};;;;` : '',
    fullNoteText ? `NOTE;CHARSET=UTF-8:${fullNoteText.replace(/\r?\n/g, '\\n')}` : '',
    'END:VCARD'
  ].filter(Boolean);

  return vCardLines.join('\r\n');
}

export async function saveCardToContacts(card: Card): Promise<boolean> {
  if (!card) return false;
  const vCardString = createVCardString(card);
  const fullName = `${card.first_name || 'contact'}_${card.last_name || 'card'}`.replace(/\s+/g, '_');
  const fileName = `${fullName}.vcf`;

  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);

  // 1. SPECIFIC HANDLING FOR iOS (Safari / Chrome on iPhone & iPad)
  if (isIOS) {
    try {
      const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      // CRITICAL: Do NOT set link.download attribute on iOS!
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return true;
    } catch (e) {
      console.warn("iOS Blob URL vCard navigation failed, attempting base64 data URI fallback:", e);
      try {
        const utf8Bytes = new TextEncoder().encode(vCardString);
        let binary = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
          binary += String.fromCharCode(utf8Bytes[i]);
        }
        const base64VCard = btoa(binary);
        const dataUri = `data:text/x-vcard;charset=utf-8;base64,${base64VCard}`;
        window.location.href = dataUri;
        return true;
      } catch (err) {
        console.error("iOS base64 fallback failed:", err);
      }
    }
  }

  // 2. SPECIFIC HANDLING FOR ANDROID (Chrome / Web Share API)
  if (isAndroid) {
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([vCardString], fileName, { type: 'text/vcard' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${card.first_name || ''} ${card.last_name || ''}`.trim(),
            text: `ذخیره مخاطب`
          });
          return true;
        }
      } catch (e) {
        console.log("Android Web Share skipped/failed, falling back to download...", e);
      }
    }
  }

  // 3. DESKTOP & FALLBACK DOWNLOAD FOR OTHER BROWSERS
  try {
    const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch (err) {
    console.error("Failed to save contact:", err);
    return false;
  }
}
