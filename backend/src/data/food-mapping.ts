/**
 * AI (YOLO/HuggingFace) tarafından döndürülen İngilizce gıda sınıflarını
 * veritabanındaki (foodLookup) Türkçe karşılıklarıyla eşleştiren sözlük.
 */
export const FOOD_MAPPING: Record<string, string> = {
  // Kuruyemişler
  "almond": "badem",
  "almonds": "badem",
  "walnut": "ceviz",
  "walnuts": "ceviz",
  "pistachio": "antep fıstığı",
  "pistachios": "antep fıstığı",
  "peanut": "yer fıstığı",
  "peanuts": "yer fıstığı",
  "cashew": "kaju",
  "cashews": "kaju",
  "hazelnut": "fındık",
  "hazelnuts": "fındık",

  // Meyveler
  "apple": "elma",
  "banana": "muz",
  "orange": "portakal",
  "strawberry": "çilek",
  "grapes": "üzüm",
  "watermelon": "karpuz",
  "mango": "mango",
  "pineapple": "ananas",
  "peach": "şeftali",
  "pear": "armut",
  "cherry": "kiraz",
  "kiwi": "kivi",
  "blueberry": "yaban mersini",
  "avocado": "avokado",
  "lemon": "limon",

  // Sebzeler
  "tomato": "domates",
  "cucumber": "salatalık",
  "carrot": "havuç",
  "broccoli": "brokoli",
  "spinach": "ıspanak",
  "potato": "patates",
  "sweet potato": "tatlı patates",
  "onion": "soğan",
  "garlic": "sarımsak",
  "bell pepper": "biber",
  "pepper": "biber",
  "mushroom": "mantar",
  "lettuce": "marul",
  "cabbage": "lahana",
  "corn": "mısır",
  "peas": "bezelye",
  "eggplant": "patlıcan",
  "zucchini": "kabak",
  "cauliflower": "karnabahar",

  // Et & Protein
  "chicken": "tavuk",
  "beef": "dana eti",
  "meat": "et",
  "pork": "domuz eti",
  "fish": "balık",
  "salmon": "somon",
  "shrimp": "karides",
  "egg": "yumurta",
  "eggs": "yumurta",

  // Diğer
  "bread": "ekmek",
  "rice": "pirinç",
  "pasta": "makarna",
  "cheese": "peynir",
  "milk": "süt",
  "yogurt": "yoğurt",
  "pizza": "pizza",
  "hamburger": "hamburger",
  "fries": "patates kızartması",
  "coffee": "kahve",
  "tea": "çay"
};
