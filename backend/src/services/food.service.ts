import axios from 'axios';
import prisma from '../config/prisma';
import { foodModel } from '../models/food.model';
import { FALLBACK_FOODS } from '../data/fallback-foods';
import { FOOD_MAPPING } from '../data/food-mapping';

const OFF_TIMEOUT_MS = 3000;
const OFF_MAX_RETRIES = 3;
const CACHE_TTL_DAYS = 7;

export class FoodService {
  /**
   * Tüm kaynaklarda (Yerel DB, Önbellek, OFF API, Yedek) arama yapar.
   * "Önce yerel, sonra harici" stratejisini izler.
   */
  async searchAcrossAllSources(query: string): Promise<{ data: any[], source: string }> {
    // AI class adlarındaki underscore'ları temizle: "fried_meat" → "fried meat"
    const normalizedQuery = query.replace(/_/g, ' ').trim();
    const lowerQuery = normalizedQuery.toLowerCase();
    const turkishTranslation = FOOD_MAPPING[lowerQuery];

    // 1. Yerel Veritabanında Ara
    // ≤2 harf sorgular ("et", "un" vb.) çok fazla yanlış eşleşme üretir, atla
    let localMatches = lowerQuery.length > 2 ? await foodModel.searchFoodByName(query) : [];

    // Türkçe çeviri yalnızca anlamlı uzunluktaysa (>3 harf) ek olarak aranır
    if (turkishTranslation && turkishTranslation !== lowerQuery && turkishTranslation.length > 3) {
      const trMatches = await foodModel.searchFoodByName(turkishTranslation);
      const existingIds = new Set(localMatches.map(m => m.id));
      trMatches.forEach(m => {
        if (!existingIds.has(m.id)) localMatches.push(m);
      });
    }

    if (localMatches.length > 0) {
      return {
        data: localMatches.map(f => ({ ...f, source: 'local' })),
        source: 'local'
      };
    }

    // 2. Fallback listesinde ara — OFF API'den önce, offline çalışır
    // Hem orijinal sorgu hem de Türkçe çeviriyle dene
    const fallbackDirect = this.searchFallbackFoods(query);
    if (fallbackDirect.data.length > 0) return fallbackDirect;
    if (turkishTranslation) {
      const fallbackTr = this.searchFallbackFoods(turkishTranslation);
      if (fallbackTr.data.length > 0) return fallbackTr;
    }

    // 3. Harici Kaynaklarda Ara (OFF API + Cache)
    // Çok kısa sorgular ("et") OFF API'de de anlamsız sonuç verir, atla
    if (lowerQuery.length <= 2) {
      return { data: [], source: 'none' };
    }

    const offResult = await this.getOffFoodsWithCache(normalizedQuery);

    if (offResult.data.length === 0 && turkishTranslation && turkishTranslation.length > 3) {
      return await this.getOffFoodsWithCache(turkishTranslation);
    }

    // Hâlâ sonuç yoksa compound query'nin ana kelimesiyle tekrar dene
    // "fried meat" → "meat", "grilled chicken" → "chicken"
    if (offResult.data.length === 0) {
      const words = lowerQuery.split(' ');
      if (words.length > 1) {
        const mainWord = words[words.length - 1];
        if (mainWord.length > 2) {
          const fallbackByWord = this.searchFallbackFoods(mainWord);
          if (fallbackByWord.data.length > 0) return fallbackByWord;
          return await this.getOffFoodsWithCache(mainWord);
        }
      }
    }

    return offResult;
  }

  private async getOffFoodsWithCache(query: string): Promise<{ data: any[], source: string }> {
    const cacheKey = query.toLowerCase().trim();

    try {
      const cached = await prisma.foodSearchCache.findUnique({
        where: { query: cacheKey }
      });

      if (cached) {
        const ageMs = Date.now() - cached.createdAt.getTime();
        const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

        if (ageMs < ttlMs) {
          return { data: JSON.parse(cached.results), source: 'cache' };
        } else {
          await prisma.foodSearchCache.delete({ where: { query: cacheKey } }).catch(() => {});
        }
      }
    } catch (err: any) {
      console.error('[FoodService Cache] Error:', err.message);
    }

    const offResult = await this.searchOpenFoodFactsWithRetry(query);

    if (offResult.source === 'api' && offResult.data.length > 0) {
      try {
        await prisma.foodSearchCache.upsert({
          where: { query: cacheKey },
          update: { results: JSON.stringify(offResult.data), createdAt: new Date() },
          create: { query: cacheKey, results: JSON.stringify(offResult.data) }
        });
      } catch (err: any) {
        console.error('[FoodService Cache] Save error:', err.message);
      }
    }

    return offResult;
  }

  private async searchOpenFoodFactsWithRetry(query: string): Promise<{ data: any[], source: string }> {
    for (let attempt = 1; attempt <= OFF_MAX_RETRIES; attempt++) {
      try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,serving_size`;
        const response = await axios.get(url, {
          timeout: OFF_TIMEOUT_MS,
          headers: { 'User-Agent': 'NutriGame/1.0' }
        });

        const products = response.data.products || [];
        const mapped = products
          .filter((p: any) => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] !== undefined)
          .map((p: any) => ({
            food_id: null,
            food_name: this.cleanFoodName(p.product_name),
            p_unit: 'g',
            p_amount: 100,
            p_calorie: Math.round(p.nutriments['energy-kcal_100g'] || 0),
            p_protein: Math.round((p.nutriments['proteins_100g'] || 0) * 10) / 10,
            p_fat: Math.round((p.nutriments['fat_100g'] || 0) * 10) / 10,
            p_carb: Math.round((p.nutriments['carbohydrates_100g'] || 0) * 10) / 10,
            source: 'off'
          }))
          .filter((item: any) => item.p_calorie > 0 && item.p_calorie <= 900);

        return { data: mapped, source: 'api' };
      } catch (err: any) {
        if (attempt === OFF_MAX_RETRIES) break;
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }

    return this.searchFallbackFoods(query);
  }

  private searchFallbackFoods(query: string): { data: any[], source: string } {
    const q = query.toLowerCase().trim();
    const matched = FALLBACK_FOODS
      .filter(f => f.food_name.toLowerCase().includes(q))
      .map(f => ({ ...f, food_id: null, source: 'fallback' }));
    return { data: matched, source: 'fallback' };
  }

  private cleanFoodName(rawName: string): string {
    let name = rawName.trim();
    name = name.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
    name = name.replace(/[®™©★☆♥♡●•◆▪▲►]/g, '');
    name = name.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '');
    name = name.replace(/\s*\([^)]*\)\s*/g, ' ');
    name = name.replace(/\s*\[[^\]]*\]\s*/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

export const foodService = new FoodService();
