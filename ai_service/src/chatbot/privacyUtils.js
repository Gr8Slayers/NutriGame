/**
 * Kişisel verileri maskelemek için regex tabanlı fonksiyonlar
 * Email, telefon, URL gibi hassas bilgileri tespit edip maskeler
 */

export class PrivacyMasker {
  constructor() {
    // Email pattern
    this.emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // Telefon pattern (Türkiye ve uluslararası formatlar)
    this.phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g;
    
    // URL pattern
    this.urlPattern = /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g;
    
    // Türk kimlik numarası pattern (11 haneli)
    this.tcPattern = /\b[1-9]\d{10}\b/g;
    
    // Kredi kartı pattern
    this.creditCardPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  }

  /**
   * Metindeki kişisel verileri maskeler
   * @param {string} text - Maskelenecek metin
   * @returns {{maskedText: string, detectedEntities: Array}} Maskelenmiş metin ve tespit edilen varlıklar
   */
  maskText(text) {
    if (!text || text.trim().length === 0) {
      return { maskedText: text, detectedEntities: [] };
    }

    const detectedEntities = [];
    let maskedText = text;

    // Email maskele
    const emails = [...text.matchAll(this.emailPattern)];
    emails.forEach(match => {
      detectedEntities.push({
        type: 'EMAIL_ADDRESS',
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    });
    maskedText = maskedText.replace(this.emailPattern, '[EMAIL]');

    // Telefon maskele
    const phones = [...text.matchAll(this.phonePattern)];
    phones.forEach(match => {
      detectedEntities.push({
        type: 'PHONE_NUMBER',
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    });
    maskedText = maskedText.replace(this.phonePattern, '[TELEFON]');

    // URL maskele
    const urls = [...text.matchAll(this.urlPattern)];
    urls.forEach(match => {
      detectedEntities.push({
        type: 'URL',
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    });
    maskedText = maskedText.replace(this.urlPattern, '[URL]');

    // TC Kimlik No maskele
    const tcIds = [...text.matchAll(this.tcPattern)];
    tcIds.forEach(match => {
      detectedEntities.push({
        type: 'TC_IDENTITY',
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    });
    maskedText = maskedText.replace(this.tcPattern, '[TC_NO]');

    // Kredi kartı maskele
    const cards = [...text.matchAll(this.creditCardPattern)];
    cards.forEach(match => {
      detectedEntities.push({
        type: 'CREDIT_CARD',
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    });
    maskedText = maskedText.replace(this.creditCardPattern, '[KART_NO]');

    return { maskedText, detectedEntities };
  }
}

// Singleton instance
let maskerInstance = null;

/**
 * Singleton pattern ile PrivacyMasker instance'ı döndür
 * @returns {PrivacyMasker}
 */
export function getPrivacyMasker() {
  if (!maskerInstance) {
    maskerInstance = new PrivacyMasker();
  }
  return maskerInstance;
}

/**
 * Kullanıcı mesajını maskeler ve detayları döndürür
 * @param {string} message - Kullanıcı mesajı
 * @returns {Object} Maskeleme sonuçları
 */
export function maskUserMessage(message) {
  const masker = getPrivacyMasker();
  const { maskedText, detectedEntities } = masker.maskText(message);
  
  return {
    original: message,
    masked: maskedText,
    detectedEntities,
    hasPersonalData: detectedEntities.length > 0
  };
}
