/**
 * Client-side mirror of /server/lib/foods.js
 * Source: Tableau Alimentaire Nutritionnel (USDA & Ciqual)
 * Used for optimistic UI calculation — server is always the source of truth.
 */

export const FOODS = {

  // ── Protéines ─────────────────────────────────────────────────────
  escalope_dinde: {
    id: 'escalope_dinde', name: 'Escalope de dinde (cuite)', nameAr: 'شريحة ديك رومي مطبوخة', emoji: '🍗', category: 'proteines',
    unit: 'g', kcal_per_100g: 135, protein_per_100g: 28, carbs_per_100g: 0, fat_per_100g: 2.5, default_amount: 150, step: 25,
  },
  escalope_poulet: {
    id: 'escalope_poulet', name: 'Escalope de poulet (cuite)', nameAr: 'شريحة دجاج مطبوخة', emoji: '🍗', category: 'proteines',
    unit: 'g', kcal_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, default_amount: 150, step: 25,
  },
  jambon_dinde: {
    id: 'jambon_dinde', name: 'Jambon de dinde', nameAr: 'لحم ديك رومي مقدد', emoji: '🥩', category: 'proteines',
    unit: 'g', kcal_per_100g: 126, protein_per_100g: 17.5, carbs_per_100g: 2, fat_per_100g: 4.8, default_amount: 100, step: 25,
  },
  steak_dinde: {
    id: 'steak_dinde', name: 'Steak de dinde (cuit)', nameAr: 'ستيك ديك رومي مطبوخ', emoji: '🥩', category: 'proteines',
    unit: 'g', kcal_per_100g: 189, protein_per_100g: 22, carbs_per_100g: 0, fat_per_100g: 10.5, default_amount: 150, step: 25,
  },
  steak_poulet: {
    id: 'steak_poulet', name: 'Steak de poulet (cuit)', nameAr: 'ستيك دجاج مطبوخ', emoji: '🍗', category: 'proteines',
    unit: 'g', kcal_per_100g: 158, protein_per_100g: 28, carbs_per_100g: 0, fat_per_100g: 4.8, default_amount: 150, step: 25,
  },
  poitrine_poulet_rotie: {
    id: 'poitrine_poulet_rotie', name: 'Poitrine de poulet rôtie', nameAr: 'صدر دجاج مشوي', emoji: '🍗', category: 'proteines',
    unit: 'g', kcal_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, default_amount: 150, step: 25,
  },
  cuisse_poulet_rotie: {
    id: 'cuisse_poulet_rotie', name: 'Cuisse de poulet rôtie', nameAr: 'فخذ دجاج مشوي', emoji: '🍗', category: 'proteines',
    unit: 'g', kcal_per_100g: 209, protein_per_100g: 25.9, carbs_per_100g: 0, fat_per_100g: 10.9, default_amount: 150, step: 25,
  },
  jambon_poulet: {
    id: 'jambon_poulet', name: 'Jambon de poulet', nameAr: 'جمبون الدجاج', emoji: '🥩', category: 'proteines',
    unit: 'g', kcal_per_100g: 115, protein_per_100g: 20.5, carbs_per_100g: 0.5, fat_per_100g: 2.8, default_amount: 100, step: 25,
  },
  viande_hachee_5: {
    id: 'viande_hachee_5', name: 'Viande hachée 5% (cuite)', nameAr: 'لحم مفروم 5٪ مطبوخ', emoji: '🥩', category: 'proteines',
    unit: 'g', kcal_per_100g: 172, protein_per_100g: 26.1, carbs_per_100g: 0, fat_per_100g: 7.2, default_amount: 150, step: 25,
  },
  viande_hachee: {
    id: 'viande_hachee', name: 'Viande hachée (cuite)', nameAr: 'لحم مفروم مطبوخ', emoji: '🥩', category: 'proteines',
    unit: 'g', kcal_per_100g: 271, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 17.9, default_amount: 150, step: 25,
  },
  viande_boeuf: {
    id: 'viande_boeuf', name: 'Viande de bœuf (cuite)', nameAr: 'لحم بقري مطبوخ', emoji: '🥩', category: 'proteines',
    unit: 'g', kcal_per_100g: 250, protein_per_100g: 30, carbs_per_100g: 0, fat_per_100g: 14, default_amount: 150, step: 25,
  },
  viande_mouton: {
    id: 'viande_mouton', name: 'Viande de mouton (cuite)', nameAr: 'لحم غنم مطبوخ', emoji: '🍖', category: 'proteines',
    unit: 'g', kcal_per_100g: 258, protein_per_100g: 28, carbs_per_100g: 0, fat_per_100g: 16, default_amount: 150, step: 25,
  },
  merguez: {
    id: 'merguez', name: 'Merguez (cuite)', nameAr: 'مرقاز مطبوخ', emoji: '🌭', category: 'proteines',
    unit: 'g', kcal_per_100g: 280, protein_per_100g: 14, carbs_per_100g: 2, fat_per_100g: 24, default_amount: 100, step: 25,
  },
  osban_tripes: {
    id: 'osban_tripes', name: 'Osban / Tripes (cuit)', nameAr: 'أسبان كرشة مطبوخة', emoji: '🍖', category: 'proteines',
    unit: 'g', kcal_per_100g: 100, protein_per_100g: 14, carbs_per_100g: 0, fat_per_100g: 5, default_amount: 150, step: 25,
  },
  foie_veau: {
    id: 'foie_veau', name: 'Foie de veau (cuit)', nameAr: 'كبد العجل مطبوخ', emoji: '🥩', category: 'proteines',
    unit: 'g', kcal_per_100g: 192, protein_per_100g: 29, carbs_per_100g: 5, fat_per_100g: 6, default_amount: 150, step: 25,
  },
  foie_poulet: {
    id: 'foie_poulet', name: 'Foie de poulet (cuit)', nameAr: 'كبد الدجاج مطبوخ', emoji: '🍗', category: 'proteines',
    unit: 'g', kcal_per_100g: 172, protein_per_100g: 27, carbs_per_100g: 1, fat_per_100g: 6, default_amount: 150, step: 25,
  },
  eggs: {
    id: 'eggs', name: 'Oeuf entier cuit (~60g)', nameAr: 'بيضة كاملة مطبوخة', emoji: '🥚', category: 'proteines',
    unit: 'piece', kcal_per_unit: 89, protein_per_unit: 5.9, carbs_per_unit: 1.0, fat_per_unit: 6.6, default_amount: 2, step: 1,
  },
  blanc_oeuf: {
    id: 'blanc_oeuf', name: "Blanc d'oeuf (cuit)", nameAr: 'بياض بيضة مطبوخ', emoji: '🥚', category: 'proteines',
    unit: 'g', kcal_per_100g: 52, protein_per_100g: 11, carbs_per_100g: 0.7, fat_per_100g: 0.2, default_amount: 100, step: 25,
  },
  poisson_blanc: {
    id: 'poisson_blanc', name: 'Poisson blanc (cuit)', nameAr: 'سمك أبيض مطبوخ', emoji: '🐟', category: 'proteines',
    unit: 'g', kcal_per_100g: 105, protein_per_100g: 22, carbs_per_100g: 0, fat_per_100g: 1.7, default_amount: 150, step: 25,
  },
  poisson_bleu: {
    id: 'poisson_bleu', name: 'Poisson bleu (cuit)', nameAr: 'سمك أزرق مطبوخ', emoji: '🐟', category: 'proteines',
    unit: 'g', kcal_per_100g: 168, protein_per_100g: 28, carbs_per_100g: 0, fat_per_100g: 5.5, default_amount: 150, step: 25,
  },
  tuna_canned: {
    id: 'tuna_canned', name: 'Thon (sans huile)', nameAr: 'تونة بدون زيت', emoji: '🐟', category: 'proteines',
    unit: 'g', kcal_per_100g: 116, protein_per_100g: 26.5, carbs_per_100g: 0, fat_per_100g: 0.8, default_amount: 150, step: 25,
  },
  sardine: {
    id: 'sardine', name: 'Sardine (sans huile)', nameAr: 'سردين بدون زيت', emoji: '🐟', category: 'proteines',
    unit: 'g', kcal_per_100g: 208, protein_per_100g: 24.6, carbs_per_100g: 0, fat_per_100g: 11.5, default_amount: 100, step: 25,
  },
  crevette: {
    id: 'crevette', name: 'Crevette (cuite)', nameAr: 'جمبري مطبوخ', emoji: '🦐', category: 'proteines',
    unit: 'g', kcal_per_100g: 99, protein_per_100g: 24, carbs_per_100g: 0, fat_per_100g: 0.3, default_amount: 150, step: 25,
  },
  saumon: {
    id: 'saumon', name: 'Saumon (cuit)', nameAr: 'سلمون مطبوخ', emoji: '🐟', category: 'proteines',
    unit: 'g', kcal_per_100g: 206, protein_per_100g: 28, carbs_per_100g: 0, fat_per_100g: 9.3, default_amount: 150, step: 25,
  },
  caviar: {
    id: 'caviar', name: 'Caviar', nameAr: 'كافيار', emoji: '🫧', category: 'proteines',
    unit: 'g', kcal_per_100g: 264, protein_per_100g: 25, carbs_per_100g: 4, fat_per_100g: 18, default_amount: 30, step: 10,
  },
  moules: {
    id: 'moules', name: 'Moules (cuites)', nameAr: 'بلح البحر مطبوخ', emoji: '🦪', category: 'proteines',
    unit: 'g', kcal_per_100g: 172, protein_per_100g: 23.8, carbs_per_100g: 7.4, fat_per_100g: 4.5, default_amount: 150, step: 25,
  },
  fruit_de_mer: {
    id: 'fruit_de_mer', name: 'Fruit de mer (cuit)', nameAr: 'مأكولات بحرية مطبوخة', emoji: '🦑', category: 'proteines',
    unit: 'g', kcal_per_100g: 75, protein_per_100g: 12.7, carbs_per_100g: 2.9, fat_per_100g: 1.4, default_amount: 150, step: 25,
  },

  // ── Glucides ──────────────────────────────────────────────────────
  pates_blanches: {
    id: 'pates_blanches', name: 'Pâtes blanches (cuites)', nameAr: 'معكرونة بيضاء مطبوخة', emoji: '🍝', category: 'glucides',
    unit: 'g', kcal_per_100g: 131, protein_per_100g: 5, carbs_per_100g: 25, fat_per_100g: 1.1, default_amount: 150, step: 25,
  },
  pates_completes: {
    id: 'pates_completes', name: 'Pâtes complètes (cuites)', nameAr: 'معكرونة كاملة مطبوخة', emoji: '🍝', category: 'glucides',
    unit: 'g', kcal_per_100g: 124, protein_per_100g: 5.2, carbs_per_100g: 23.5, fat_per_100g: 1, default_amount: 150, step: 25,
  },
  pates_integrales: {
    id: 'pates_integrales', name: 'Pâtes intégrales (cuites)', nameAr: 'معكرونة متكاملة مطبوخة', emoji: '🍝', category: 'glucides',
    unit: 'g', kcal_per_100g: 120, protein_per_100g: 4.8, carbs_per_100g: 22.5, fat_per_100g: 1, default_amount: 150, step: 25,
  },
  pates_sans_gluten: {
    id: 'pates_sans_gluten', name: 'Pâtes sans gluten (cuites)', nameAr: 'معكرونة بلا غلوتين', emoji: '🍝', category: 'glucides',
    unit: 'g', kcal_per_100g: 128, protein_per_100g: 2.5, carbs_per_100g: 28.5, fat_per_100g: 0.8, default_amount: 150, step: 25,
  },
  makrouna: {
    id: 'makrouna', name: 'Makrouna (cuites)', nameAr: 'مقرونة مطبوخة', emoji: '🍝', category: 'glucides',
    unit: 'g', kcal_per_100g: 131, protein_per_100g: 5, carbs_per_100g: 25, fat_per_100g: 1.1, default_amount: 150, step: 25,
  },
  riz_blanc: {
    id: 'riz_blanc', name: 'Riz blanc (cuit)', nameAr: 'أرز أبيض مطبوخ', emoji: '🍚', category: 'glucides',
    unit: 'g', kcal_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28.6, fat_per_100g: 0.3, default_amount: 150, step: 25,
  },
  riz_complet: {
    id: 'riz_complet', name: 'Riz complet (cuit)', nameAr: 'أرز كامل مطبوخ', emoji: '🍚', category: 'glucides',
    unit: 'g', kcal_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, default_amount: 150, step: 25,
  },
  riz_basmati: {
    id: 'riz_basmati', name: 'Riz basmati (cuit)', nameAr: 'أرز بسمتي مطبوخ', emoji: '🍚', category: 'glucides',
    unit: 'g', kcal_per_100g: 121, protein_per_100g: 2.5, carbs_per_100g: 26.8, fat_per_100g: 0.3, default_amount: 150, step: 25,
  },
  bulgur_cooked: {
    id: 'bulgur_cooked', name: 'Boulgour (cuit)', nameAr: 'برغل مطبوخ', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 83, protein_per_100g: 3.1, carbs_per_100g: 18.6, fat_per_100g: 0.2, default_amount: 150, step: 25,
  },
  boulgour_complet: {
    id: 'boulgour_complet', name: 'Boulgour complet (cuit)', nameAr: 'برغل كامل مطبوخ', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 83, protein_per_100g: 3.1, carbs_per_100g: 18.6, fat_per_100g: 0.2, default_amount: 150, step: 25,
  },
  couscous: {
    id: 'couscous', name: 'Couscous (cuit)', nameAr: 'كسكس مطبوخ', emoji: '🫘', category: 'glucides',
    unit: 'g', kcal_per_100g: 112, protein_per_100g: 3.8, carbs_per_100g: 23.2, fat_per_100g: 0.2, default_amount: 150, step: 25,
  },
  couscous_complet: {
    id: 'couscous_complet', name: 'Couscous complet (cuit)', nameAr: 'كسكس كامل مطبوخ', emoji: '🫘', category: 'glucides',
    unit: 'g', kcal_per_100g: 112, protein_per_100g: 3.8, carbs_per_100g: 23.2, fat_per_100g: 0.2, default_amount: 150, step: 25,
  },
  semoule: {
    id: 'semoule', name: 'Semoule (cuite)', nameAr: 'سميد مطبوخ', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 100, protein_per_100g: 3.5, carbs_per_100g: 21, fat_per_100g: 0.2, default_amount: 150, step: 25,
  },
  flocons_avoine: {
    id: 'flocons_avoine', name: "Flocons d'avoine (cuits)", nameAr: 'شوفان مطبوخ', emoji: '🥣', category: 'glucides',
    unit: 'g', kcal_per_100g: 68, protein_per_100g: 2.4, carbs_per_100g: 12, fat_per_100g: 1.4, default_amount: 150, step: 25,
  },
  quinoa: {
    id: 'quinoa', name: 'Quinoa (cuit)', nameAr: 'كينوا مطبوخ', emoji: '🌱', category: 'glucides',
    unit: 'g', kcal_per_100g: 120, protein_per_100g: 4.4, carbs_per_100g: 21.3, fat_per_100g: 1.9, default_amount: 150, step: 25,
  },
  orge: {
    id: 'orge', name: 'Orge (cuite)', nameAr: 'شعير مطبوخ', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 123, protein_per_100g: 2.3, carbs_per_100g: 28.2, fat_per_100g: 0.4, default_amount: 150, step: 25,
  },
  potatoes_boiled: {
    id: 'potatoes_boiled', name: 'Pomme de terre (cuite)', nameAr: 'بطاطا مطبوخة', emoji: '🥔', category: 'glucides',
    unit: 'g', kcal_per_100g: 87, protein_per_100g: 1.9, carbs_per_100g: 20.1, fat_per_100g: 0.1, default_amount: 150, step: 25,
  },
  patate_douce: {
    id: 'patate_douce', name: 'Patate douce (cuite)', nameAr: 'بطاطا حلوة مطبوخة', emoji: '🍠', category: 'glucides',
    unit: 'g', kcal_per_100g: 90, protein_per_100g: 2, carbs_per_100g: 20.7, fat_per_100g: 0.1, default_amount: 150, step: 25,
  },
  pois_chiches: {
    id: 'pois_chiches', name: 'Pois chiches (cuits)', nameAr: 'حمص مطبوخ', emoji: '🫘', category: 'glucides',
    unit: 'g', kcal_per_100g: 164, protein_per_100g: 8.9, carbs_per_100g: 27.4, fat_per_100g: 2.6, default_amount: 150, step: 25,
  },
  lentilles: {
    id: 'lentilles', name: 'Lentilles (cuites)', nameAr: 'عدس مطبوخ', emoji: '🫘', category: 'glucides',
    unit: 'g', kcal_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20.1, fat_per_100g: 0.4, default_amount: 150, step: 25,
  },
  haricot_rouge: {
    id: 'haricot_rouge', name: 'Haricot rouge (cuit)', nameAr: 'فول أحمر مطبوخ', emoji: '🫘', category: 'glucides',
    unit: 'g', kcal_per_100g: 127, protein_per_100g: 8.7, carbs_per_100g: 22.8, fat_per_100g: 0.5, default_amount: 150, step: 25,
  },
  haricot_blanc: {
    id: 'haricot_blanc', name: 'Haricot blanc (cuit)', nameAr: 'فاصوليا بيضاء مطبوخة', emoji: '🫘', category: 'glucides',
    unit: 'g', kcal_per_100g: 114, protein_per_100g: 7.3, carbs_per_100g: 20.6, fat_per_100g: 0.4, default_amount: 150, step: 25,
  },
  haricot_noir: {
    id: 'haricot_noir', name: 'Haricot noir (cuit)', nameAr: 'فاصوليا سوداء مطبوخة', emoji: '🫘', category: 'glucides',
    unit: 'g', kcal_per_100g: 132, protein_per_100g: 8.9, carbs_per_100g: 23.7, fat_per_100g: 0.5, default_amount: 150, step: 25,
  },
  petit_pois: {
    id: 'petit_pois', name: 'Petit pois (frais)', nameAr: 'بازلاء طازجة', emoji: '🫛', category: 'glucides',
    unit: 'g', kcal_per_100g: 77, protein_per_100g: 5, carbs_per_100g: 13.7, fat_per_100g: 0.4, default_amount: 100, step: 25,
  },
  foul_medames: {
    id: 'foul_medames', name: 'Foul medames (cuit)', nameAr: 'فول مدمس مطبوخ', emoji: '🫘', category: 'glucides',
    unit: 'g', kcal_per_100g: 110, protein_per_100g: 7.6, carbs_per_100g: 20, fat_per_100g: 0.4, default_amount: 150, step: 25,
  },
  pain_blanc: {
    id: 'pain_blanc', name: 'Pain blanc', nameAr: 'خبز أبيض', emoji: '🍞', category: 'glucides',
    unit: 'g', kcal_per_100g: 266, protein_per_100g: 7.6, carbs_per_100g: 50, fat_per_100g: 3.3, default_amount: 60, step: 20,
  },
  pain_complet: {
    id: 'pain_complet', name: 'Pain complet', nameAr: 'خبز كامل', emoji: '🍞', category: 'glucides',
    unit: 'g', kcal_per_100g: 313, protein_per_100g: 13, carbs_per_100g: 56, fat_per_100g: 4.3, default_amount: 60, step: 20,
  },
  pain_cereales: {
    id: 'pain_cereales', name: 'Pain céréales', nameAr: 'خبز بالحبوب', emoji: '🍞', category: 'glucides',
    unit: 'g', kcal_per_100g: 285, protein_per_100g: 9.3, carbs_per_100g: 55, fat_per_100g: 6, default_amount: 60, step: 20,
  },
  pain_de_mie: {
    id: 'pain_de_mie', name: 'Pain de mie (1 tranche)', nameAr: 'خبز التوست', emoji: '🍞', category: 'glucides',
    unit: 'piece', kcal_per_unit: 81, protein_per_unit: 2.5, carbs_per_unit: 12.2, fat_per_unit: 2.5, default_amount: 2, step: 1,
  },
  bread_taaouna: {
    id: 'bread_taaouna', name: 'Tabouna / Kesra', nameAr: 'تابونة كسرة', emoji: '🫓', category: 'glucides',
    unit: 'g', kcal_per_100g: 280, protein_per_100g: 8.5, carbs_per_100g: 56, fat_per_100g: 2.5, default_amount: 60, step: 20,
  },
  baguette: {
    id: 'baguette', name: 'Baguette', nameAr: 'باقيت', emoji: '🥖', category: 'glucides',
    unit: 'g', kcal_per_100g: 270, protein_per_100g: 9, carbs_per_100g: 53, fat_per_100g: 1.3, default_amount: 60, step: 20,
  },
  galette_riz: {
    id: 'galette_riz', name: 'Galette de riz', nameAr: 'قرص الأرز', emoji: '🫓', category: 'glucides',
    unit: 'piece', kcal_per_unit: 38, protein_per_unit: 0.7, carbs_per_unit: 7.9, fat_per_unit: 0.4, default_amount: 2, step: 1,
  },
  corn_flakes: {
    id: 'corn_flakes', name: 'Corn flakes', nameAr: 'كورن فليكس', emoji: '🥣', category: 'glucides',
    unit: 'g', kcal_per_100g: 375, protein_per_100g: 8, carbs_per_100g: 84, fat_per_100g: 1, default_amount: 40, step: 10,
  },
  farine_blanche: {
    id: 'farine_blanche', name: 'Farine blanche', nameAr: 'دقيق أبيض', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 364, protein_per_100g: 10, carbs_per_100g: 76, fat_per_100g: 1, default_amount: 50, step: 10,
  },
  farine_complete: {
    id: 'farine_complete', name: 'Farine complète', nameAr: 'دقيق كامل', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 315, protein_per_100g: 12, carbs_per_100g: 61, fat_per_100g: 0.5, default_amount: 50, step: 10,
  },
  farine_mais: {
    id: 'farine_mais', name: 'Farine de maïs', nameAr: 'دقيق الذرة', emoji: '🌽', category: 'glucides',
    unit: 'g', kcal_per_100g: 353, protein_per_100g: 6, carbs_per_100g: 76, fat_per_100g: 2, default_amount: 50, step: 10,
  },
  farine_riz: {
    id: 'farine_riz', name: 'Farine de riz', nameAr: 'دقيق الأرز', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 355, protein_per_100g: 5.8, carbs_per_100g: 77.6, fat_per_100g: 1.5, default_amount: 50, step: 10,
  },
  farine_seigle: {
    id: 'farine_seigle', name: 'Farine de seigle', nameAr: 'دقيق الجاودار', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 364, protein_per_100g: 10, carbs_per_100g: 78.2, fat_per_100g: 1.4, default_amount: 50, step: 10,
  },
  bsissa_orge: {
    id: 'bsissa_orge', name: 'Bsissa orge', nameAr: 'بسيسة شعير', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 347, protein_per_100g: 10, carbs_per_100g: 71, fat_per_100g: 1.4, default_amount: 50, step: 10,
  },
  bsissa_ble: {
    id: 'bsissa_ble', name: 'Bsissa blé', nameAr: 'بسيسة قمح', emoji: '🌾', category: 'glucides',
    unit: 'g', kcal_per_100g: 283, protein_per_100g: 11.8, carbs_per_100g: 50.9, fat_per_100g: 6.1, default_amount: 50, step: 10,
  },
  tortilla_wrap: {
    id: 'tortilla_wrap', name: 'Tortilla wrap', nameAr: 'تورتيا', emoji: '🫓', category: 'glucides',
    unit: 'g', kcal_per_100g: 283, protein_per_100g: 7.5, carbs_per_100g: 45, fat_per_100g: 7.5, default_amount: 75, step: 25,
  },
  brik_feuille: {
    id: 'brik_feuille', name: 'Brik (feuille de)', nameAr: 'ورقة البريك', emoji: '📄', category: 'glucides',
    unit: 'g', kcal_per_100g: 330, protein_per_100g: 8.5, carbs_per_100g: 62, fat_per_100g: 5.5, default_amount: 30, step: 10,
  },
  assida: {
    id: 'assida', name: 'Assida (cuite)', nameAr: 'عصيدة مطبوخة', emoji: '🥣', category: 'glucides',
    unit: 'g', kcal_per_100g: 150, protein_per_100g: 3, carbs_per_100g: 32, fat_per_100g: 1.5, default_amount: 150, step: 25,
  },

  // ── Légumes ───────────────────────────────────────────────────────
  tomates: {
    id: 'tomates', name: 'Tomates', nameAr: 'طماطم', emoji: '🍅', category: 'legumes',
    unit: 'g', kcal_per_100g: 22, protein_per_100g: 1, carbs_per_100g: 4.8, fat_per_100g: 0.3, default_amount: 150, step: 50,
  },
  laitue: {
    id: 'laitue', name: 'Laitue', nameAr: 'خس', emoji: '🥬', category: 'legumes',
    unit: 'g', kcal_per_100g: 15, protein_per_100g: 1, carbs_per_100g: 2.6, fat_per_100g: 0.1, default_amount: 100, step: 50,
  },
  oignon: {
    id: 'oignon', name: 'Oignon', nameAr: 'بصل', emoji: '🧅', category: 'legumes',
    unit: 'g', kcal_per_100g: 42, protein_per_100g: 0.9, carbs_per_100g: 10.1, fat_per_100g: 0.1, default_amount: 100, step: 25,
  },
  courgette: {
    id: 'courgette', name: 'Courgette', nameAr: 'كوسا', emoji: '🥒', category: 'legumes',
    unit: 'g', kcal_per_100g: 16, protein_per_100g: 1.2, carbs_per_100g: 3.4, fat_per_100g: 0.2, default_amount: 150, step: 50,
  },
  carotte: {
    id: 'carotte', name: 'Carotte', nameAr: 'جزر', emoji: '🥕', category: 'legumes',
    unit: 'g', kcal_per_100g: 41, protein_per_100g: 0.9, carbs_per_100g: 9.6, fat_per_100g: 0.2, default_amount: 100, step: 25,
  },
  epinard: {
    id: 'epinard', name: 'Épinard', nameAr: 'سبانخ', emoji: '🥬', category: 'legumes',
    unit: 'g', kcal_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4, default_amount: 100, step: 25,
  },
  aubergine: {
    id: 'aubergine', name: 'Aubergine', nameAr: 'باذنجان', emoji: '🍆', category: 'legumes',
    unit: 'g', kcal_per_100g: 24, protein_per_100g: 1, carbs_per_100g: 5.7, fat_per_100g: 0.2, default_amount: 150, step: 50,
  },
  betterave: {
    id: 'betterave', name: 'Betterave', nameAr: 'شمندر', emoji: '🟣', category: 'legumes',
    unit: 'g', kcal_per_100g: 60, protein_per_100g: 2.2, carbs_per_100g: 13, fat_per_100g: 0.2, default_amount: 100, step: 25,
  },
  chou: {
    id: 'chou', name: 'Chou', nameAr: 'ملفوف', emoji: '🥬', category: 'legumes',
    unit: 'g', kcal_per_100g: 22, protein_per_100g: 1.5, carbs_per_100g: 4.5, fat_per_100g: 0.2, default_amount: 100, step: 25,
  },
  brocoli: {
    id: 'brocoli', name: 'Brocoli', nameAr: 'بروكلي', emoji: '🥦', category: 'legumes',
    unit: 'g', kcal_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 6.6, fat_per_100g: 0.4, default_amount: 150, step: 50,
  },
  champignon: {
    id: 'champignon', name: 'Champignon', nameAr: 'فطر', emoji: '🍄', category: 'legumes',
    unit: 'g', kcal_per_100g: 22, protein_per_100g: 3.1, carbs_per_100g: 3.3, fat_per_100g: 0.3, default_amount: 100, step: 25,
  },
  chou_fleur: {
    id: 'chou_fleur', name: 'Chou-fleur', nameAr: 'قرنبيط', emoji: '🥦', category: 'legumes',
    unit: 'g', kcal_per_100g: 25, protein_per_100g: 2, carbs_per_100g: 5.3, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  piment: {
    id: 'piment', name: 'Piment', nameAr: 'فلفل حار', emoji: '🌶️', category: 'legumes',
    unit: 'g', kcal_per_100g: 40, protein_per_100g: 1.9, carbs_per_100g: 9.1, fat_per_100g: 0.3, default_amount: 50, step: 25,
  },
  asperge: {
    id: 'asperge', name: 'Asperge', nameAr: 'هليون', emoji: '🌿', category: 'legumes',
    unit: 'g', kcal_per_100g: 20, protein_per_100g: 2.2, carbs_per_100g: 3.9, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  haricot_vert: {
    id: 'haricot_vert', name: 'Haricot vert', nameAr: 'فاصوليا خضراء', emoji: '🫛', category: 'legumes',
    unit: 'g', kcal_per_100g: 31, protein_per_100g: 1.8, carbs_per_100g: 7.1, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  radis: {
    id: 'radis', name: 'Radis', nameAr: 'فجل', emoji: '🌱', category: 'legumes',
    unit: 'g', kcal_per_100g: 14, protein_per_100g: 0.7, carbs_per_100g: 1.8, fat_per_100g: 0.1, default_amount: 100, step: 25,
  },
  artichaut: {
    id: 'artichaut', name: 'Artichaut', nameAr: 'أرضي شوكي', emoji: '🌿', category: 'legumes',
    unit: 'g', kcal_per_100g: 47, protein_per_100g: 3.3, carbs_per_100g: 10.5, fat_per_100g: 0.2, default_amount: 100, step: 25,
  },
  ail: {
    id: 'ail', name: 'Ail', nameAr: 'ثوم', emoji: '🧄', category: 'legumes',
    unit: 'g', kcal_per_100g: 149, protein_per_100g: 6.4, carbs_per_100g: 33.1, fat_per_100g: 0.6, default_amount: 10, step: 5,
  },
  navet: {
    id: 'navet', name: 'Navet', nameAr: 'لفت', emoji: '🟣', category: 'legumes',
    unit: 'g', kcal_per_100g: 28, protein_per_100g: 0.9, carbs_per_100g: 6.4, fat_per_100g: 0.1, default_amount: 100, step: 25,
  },
  persil: {
    id: 'persil', name: 'Persil', nameAr: 'بقدونس', emoji: '🌿', category: 'legumes',
    unit: 'g', kcal_per_100g: 36, protein_per_100g: 3, carbs_per_100g: 6.3, fat_per_100g: 0.8, default_amount: 20, step: 10,
  },
  bette: {
    id: 'bette', name: 'Bette / Blette', nameAr: 'سلق', emoji: '🥬', category: 'legumes',
    unit: 'g', kcal_per_100g: 19, protein_per_100g: 1.8, carbs_per_100g: 3.7, fat_per_100g: 0.2, default_amount: 100, step: 25,
  },
  celeri: {
    id: 'celeri', name: 'Céleri', nameAr: 'كرفس', emoji: '🌿', category: 'legumes',
    unit: 'g', kcal_per_100g: 14, protein_per_100g: 0.7, carbs_per_100g: 3, fat_per_100g: 0.1, default_amount: 100, step: 25,
  },
  feve_fraiche: {
    id: 'feve_fraiche', name: 'Fève fraîche', nameAr: 'فول أخضر', emoji: '🫘', category: 'legumes',
    unit: 'g', kcal_per_100g: 76, protein_per_100g: 4.7, carbs_per_100g: 12, fat_per_100g: 0.6, default_amount: 100, step: 25,
  },
  menthe: {
    id: 'menthe', name: 'Menthe', nameAr: 'نعناع', emoji: '🌿', category: 'legumes',
    unit: 'g', kcal_per_100g: 70, protein_per_100g: 3.8, carbs_per_100g: 14.9, fat_per_100g: 0.9, default_amount: 20, step: 10,
  },
  fenouil: {
    id: 'fenouil', name: 'Fenouil', nameAr: 'شمر', emoji: '🌿', category: 'legumes',
    unit: 'g', kcal_per_100g: 31, protein_per_100g: 1.2, carbs_per_100g: 7.3, fat_per_100g: 0.2, default_amount: 100, step: 25,
  },
  citrouille: {
    id: 'citrouille', name: 'Citrouille', nameAr: 'قرع', emoji: '🎃', category: 'legumes',
    unit: 'g', kcal_per_100g: 26, protein_per_100g: 1, carbs_per_100g: 6.5, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  feve_soja: {
    id: 'feve_soja', name: 'Fève de soja', nameAr: 'فول الصويا', emoji: '🫘', category: 'legumes',
    unit: 'g', kcal_per_100g: 124, protein_per_100g: 13, carbs_per_100g: 7.6, fat_per_100g: 4.4, default_amount: 100, step: 25,
  },
  mais_doux: {
    id: 'mais_doux', name: 'Maïs doux', nameAr: 'ذرة حلوة', emoji: '🌽', category: 'legumes',
    unit: 'g', kcal_per_100g: 122, protein_per_100g: 4, carbs_per_100g: 30, fat_per_100g: 1, default_amount: 100, step: 25,
  },
  mloukhiya: {
    id: 'mloukhiya', name: 'Mloukhiya (poudre)', nameAr: 'ملوخية بودرة', emoji: '🌿', category: 'legumes',
    unit: 'g', kcal_per_100g: 239, protein_per_100g: 23, carbs_per_100g: 12.7, fat_per_100g: 1.8, default_amount: 10, step: 5,
  },
  sauce_tomate: {
    id: 'sauce_tomate', name: 'Sauce tomate', nameAr: 'صلصة الطماطم', emoji: '🍅', category: 'legumes',
    unit: 'g', kcal_per_100g: 54, protein_per_100g: 2.5, carbs_per_100g: 10.5, fat_per_100g: 0.6, default_amount: 100, step: 25,
  },
  harissa: {
    id: 'harissa', name: 'Harissa', nameAr: 'هريسة', emoji: '🌶️', category: 'legumes',
    unit: 'g', kcal_per_100g: 50, protein_per_100g: 2, carbs_per_100g: 8, fat_per_100g: 1.5, default_amount: 20, step: 5,
  },
  chermoula: {
    id: 'chermoula', name: 'Chermoula', nameAr: 'الشرمولة', emoji: '🌿', category: 'legumes',
    unit: 'g', kcal_per_100g: 90, protein_per_100g: 1.5, carbs_per_100g: 5, fat_per_100g: 7, default_amount: 30, step: 10,
  },
  hlelem: {
    id: 'hlelem', name: 'Hlelem (cuite)', nameAr: 'حلالم مطبوخة', emoji: '🍲', category: 'legumes',
    unit: 'g', kcal_per_100g: 120, protein_per_100g: 6, carbs_per_100g: 18, fat_per_100g: 2.5, default_amount: 150, step: 50,
  },
  cucumber: {
    id: 'cucumber', name: 'Concombre', nameAr: 'خيار', emoji: '🥒', category: 'legumes',
    unit: 'g', kcal_per_100g: 15, protein_per_100g: 0.7, carbs_per_100g: 3.6, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  slata_mechouia: {
    id: 'slata_mechouia', name: 'Slata Mechouia', nameAr: 'سلاطة مشوية', emoji: '🫑', category: 'legumes',
    unit: 'g', kcal_per_100g: 80, protein_per_100g: 1.2, carbs_per_100g: 6.0, fat_per_100g: 5.5, default_amount: 150, step: 50,
  },

  // ── Fruits ────────────────────────────────────────────────────────
  pomme: {
    id: 'pomme', name: 'Pomme', nameAr: 'تفاح', emoji: '🍎', category: 'fruits',
    unit: 'g', kcal_per_100g: 53, protein_per_100g: 0.2, carbs_per_100g: 10.7, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  banane: {
    id: 'banane', name: 'Banane', nameAr: 'موز', emoji: '🍌', category: 'fruits',
    unit: 'g', kcal_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, default_amount: 120, step: 50,
  },
  orange: {
    id: 'orange', name: 'Orange', nameAr: 'برتقال', emoji: '🍊', category: 'fruits',
    unit: 'g', kcal_per_100g: 48, protein_per_100g: 1, carbs_per_100g: 12, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  pasteque: {
    id: 'pasteque', name: 'Pastèque', nameAr: 'بطيخ', emoji: '🍉', category: 'fruits',
    unit: 'g', kcal_per_100g: 35, protein_per_100g: 0.6, carbs_per_100g: 7.3, fat_per_100g: 0.1, default_amount: 200, step: 50,
  },
  melon: {
    id: 'melon', name: 'Melon', nameAr: 'شمام', emoji: '🍈', category: 'fruits',
    unit: 'g', kcal_per_100g: 41, protein_per_100g: 0.7, carbs_per_100g: 8.8, fat_per_100g: 0, default_amount: 200, step: 50,
  },
  strawberries: {
    id: 'strawberries', name: 'Fraise', nameAr: 'فراولة', emoji: '🍓', category: 'fruits',
    unit: 'g', kcal_per_100g: 35, protein_per_100g: 0.6, carbs_per_100g: 8, fat_per_100g: 0.3, default_amount: 150, step: 50,
  },
  raisin: {
    id: 'raisin', name: 'Raisin', nameAr: 'عنب', emoji: '🍇', category: 'fruits',
    unit: 'g', kcal_per_100g: 69, protein_per_100g: 0.7, carbs_per_100g: 18.1, fat_per_100g: 0.2, default_amount: 150, step: 50,
  },
  grenade: {
    id: 'grenade', name: 'Grenade', nameAr: 'رمان', emoji: '🍎', category: 'fruits',
    unit: 'g', kcal_per_100g: 76, protein_per_100g: 1.3, carbs_per_100g: 14.2, fat_per_100g: 0.7, default_amount: 150, step: 50,
  },
  figue_fraiche: {
    id: 'figue_fraiche', name: 'Figue fraîche', nameAr: 'تين طازج', emoji: '🟣', category: 'fruits',
    unit: 'g', kcal_per_100g: 74, protein_per_100g: 0.8, carbs_per_100g: 19, fat_per_100g: 0.3, default_amount: 100, step: 25,
  },
  figue_barbarie: {
    id: 'figue_barbarie', name: 'Figue de barbarie', nameAr: 'هندي', emoji: '🌵', category: 'fruits',
    unit: 'g', kcal_per_100g: 41, protein_per_100g: 0.7, carbs_per_100g: 9.6, fat_per_100g: 0.5, default_amount: 100, step: 25,
  },
  abricot: {
    id: 'abricot', name: 'Abricot', nameAr: 'مشمش', emoji: '🍑', category: 'fruits',
    unit: 'g', kcal_per_100g: 49, protein_per_100g: 1.1, carbs_per_100g: 8.5, fat_per_100g: 0.4, default_amount: 150, step: 50,
  },
  peaches: {
    id: 'peaches', name: 'Pêche', nameAr: 'خوخ', emoji: '🍑', category: 'fruits',
    unit: 'g', kcal_per_100g: 55, protein_per_100g: 1, carbs_per_100g: 9, fat_per_100g: 0.3, default_amount: 150, step: 50,
  },
  kiwi: {
    id: 'kiwi', name: 'Kiwi', nameAr: 'كيوي', emoji: '🥝', category: 'fruits',
    unit: 'g', kcal_per_100g: 61, protein_per_100g: 1.1, carbs_per_100g: 14.6, fat_per_100g: 0.5, default_amount: 100, step: 25,
  },
  mangue: {
    id: 'mangue', name: 'Mangue', nameAr: 'مانجو', emoji: '🥭', category: 'fruits',
    unit: 'g', kcal_per_100g: 67, protein_per_100g: 0.7, carbs_per_100g: 15.3, fat_per_100g: 0.7, default_amount: 150, step: 50,
  },
  ananas: {
    id: 'ananas', name: 'Ananas', nameAr: 'أناناس', emoji: '🍍', category: 'fruits',
    unit: 'g', kcal_per_100g: 48, protein_per_100g: 0.5, carbs_per_100g: 12.6, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  citron: {
    id: 'citron', name: 'Citron', nameAr: 'ليمون', emoji: '🍋', category: 'fruits',
    unit: 'g', kcal_per_100g: 29, protein_per_100g: 1, carbs_per_100g: 9.3, fat_per_100g: 0.3, default_amount: 50, step: 25,
  },
  poire: {
    id: 'poire', name: 'Poire', nameAr: 'كمثرى', emoji: '🍐', category: 'fruits',
    unit: 'g', kcal_per_100g: 58, protein_per_100g: 0.4, carbs_per_100g: 15.4, fat_per_100g: 0.1, default_amount: 150, step: 50,
  },
  cerises: {
    id: 'cerises', name: 'Cerises', nameAr: 'كرز', emoji: '🍒', category: 'fruits',
    unit: 'g', kcal_per_100g: 46, protein_per_100g: 0.9, carbs_per_100g: 11, fat_per_100g: 0.4, default_amount: 150, step: 50,
  },
  prune: {
    id: 'prune', name: 'Prune', nameAr: 'برقوق', emoji: '🟣', category: 'fruits',
    unit: 'g', kcal_per_100g: 46, protein_per_100g: 0.7, carbs_per_100g: 11.4, fat_per_100g: 0.7, default_amount: 150, step: 50,
  },
  framboise: {
    id: 'framboise', name: 'Framboise', nameAr: 'توت أحمر', emoji: '🫐', category: 'fruits',
    unit: 'g', kcal_per_100g: 52, protein_per_100g: 1.2, carbs_per_100g: 12, fat_per_100g: 0.7, default_amount: 150, step: 50,
  },
  mure: {
    id: 'mure', name: 'Mûre', nameAr: 'توت أسود', emoji: '🫐', category: 'fruits',
    unit: 'g', kcal_per_100g: 43, protein_per_100g: 1.4, carbs_per_100g: 9.6, fat_per_100g: 0.5, default_amount: 150, step: 50,
  },
  pamplemousse: {
    id: 'pamplemousse', name: 'Pamplemousse', nameAr: 'جريب فروت', emoji: '🍊', category: 'fruits',
    unit: 'g', kcal_per_100g: 32, protein_per_100g: 0.6, carbs_per_100g: 8, fat_per_100g: 0.1, default_amount: 200, step: 50,
  },
  nefle: {
    id: 'nefle', name: 'Nèfle', nameAr: 'إسبيدج', emoji: '🟡', category: 'fruits',
    unit: 'g', kcal_per_100g: 56, protein_per_100g: 0.4, carbs_per_100g: 12, fat_per_100g: 0.3, default_amount: 100, step: 25,
  },
  dattes: {
    id: 'dattes', name: 'Dattes', nameAr: 'تمر', emoji: '🟤', category: 'fruits',
    unit: 'g', kcal_per_100g: 300, protein_per_100g: 2.2, carbs_per_100g: 69, fat_per_100g: 0.4, default_amount: 30, step: 10,
  },
  raisin_sec: {
    id: 'raisin_sec', name: 'Raisin sec', nameAr: 'زبيب', emoji: '🍇', category: 'fruits',
    unit: 'g', kcal_per_100g: 299, protein_per_100g: 3, carbs_per_100g: 80, fat_per_100g: 0.5, default_amount: 30, step: 10,
  },
  figue_sechee: {
    id: 'figue_sechee', name: 'Figue séchée', nameAr: 'تين مجفف', emoji: '🟤', category: 'fruits',
    unit: 'g', kcal_per_100g: 294, protein_per_100g: 3.3, carbs_per_100g: 58, fat_per_100g: 2.6, default_amount: 30, step: 10,
  },
  banane_sechee: {
    id: 'banane_sechee', name: 'Banane séchée', nameAr: 'موز مجفف', emoji: '🍌', category: 'fruits',
    unit: 'g', kcal_per_100g: 311, protein_per_100g: 3.3, carbs_per_100g: 69, fat_per_100g: 0.4, default_amount: 30, step: 10,
  },

  // ── Snacks & Oléagineux ──────────────────────────────────────────
  almonds: {
    id: 'almonds', name: 'Amande', nameAr: 'لوز', emoji: '🌰', category: 'snacks',
    unit: 'g', kcal_per_100g: 623, protein_per_100g: 25, carbs_per_100g: 8, fat_per_100g: 53, default_amount: 25, step: 5,
  },
  cajou: {
    id: 'cajou', name: 'Cajou', nameAr: 'كاجو', emoji: '🌰', category: 'snacks',
    unit: 'g', kcal_per_100g: 553, protein_per_100g: 18.2, carbs_per_100g: 30.2, fat_per_100g: 44, default_amount: 25, step: 5,
  },
  cacahuetes: {
    id: 'cacahuetes', name: 'Cacahuètes', nameAr: 'فول سوداني', emoji: '🥜', category: 'snacks',
    unit: 'g', kcal_per_100g: 619, protein_per_100g: 26.8, carbs_per_100g: 11, fat_per_100g: 50.5, default_amount: 25, step: 5,
  },
  noisette: {
    id: 'noisette', name: 'Noisette', nameAr: 'بندق', emoji: '🌰', category: 'snacks',
    unit: 'g', kcal_per_100g: 666, protein_per_100g: 15, carbs_per_100g: 4.7, fat_per_100g: 63, default_amount: 25, step: 5,
  },
  pistaches: {
    id: 'pistaches', name: 'Pistaches', nameAr: 'فستق حلبي', emoji: '🟢', category: 'snacks',
    unit: 'g', kcal_per_100g: 570, protein_per_100g: 21.4, carbs_per_100g: 26.7, fat_per_100g: 46, default_amount: 25, step: 5,
  },
  noix: {
    id: 'noix', name: 'Noix', nameAr: 'جوز', emoji: '🌰', category: 'snacks',
    unit: 'g', kcal_per_100g: 654, protein_per_100g: 15.2, carbs_per_100g: 14, fat_per_100g: 65.2, default_amount: 25, step: 5,
  },
  graines_tournesol: {
    id: 'graines_tournesol', name: 'Graines de tournesol', nameAr: 'بذور دوار الشمس', emoji: '🌻', category: 'snacks',
    unit: 'g', kcal_per_100g: 620, protein_per_100g: 24.1, carbs_per_100g: 5.3, fat_per_100g: 54.5, default_amount: 25, step: 5,
  },
  graines_chia: {
    id: 'graines_chia', name: 'Graines de chia', nameAr: 'بذور الشيا', emoji: '🌱', category: 'snacks',
    unit: 'g', kcal_per_100g: 455, protein_per_100g: 21, carbs_per_100g: 0.6, fat_per_100g: 33, default_amount: 20, step: 5,
  },
  avocat: {
    id: 'avocat', name: 'Avocat', nameAr: 'أفوكادو', emoji: '🥑', category: 'snacks',
    unit: 'g', kcal_per_100g: 205, protein_per_100g: 2, carbs_per_100g: 3.5, fat_per_100g: 22, default_amount: 100, step: 25,
  },
  beurre_cacahuetes: {
    id: 'beurre_cacahuetes', name: 'Beurre de cacahuètes', nameAr: 'زبدة الفول السوداني', emoji: '🥜', category: 'snacks',
    unit: 'g', kcal_per_100g: 619, protein_per_100g: 26.8, carbs_per_100g: 11, fat_per_100g: 50.5, default_amount: 20, step: 5,
  },
  noix_de_coco: {
    id: 'noix_de_coco', name: 'Noix de coco', nameAr: 'جوز الهند', emoji: '🥥', category: 'snacks',
    unit: 'g', kcal_per_100g: 354, protein_per_100g: 3.3, carbs_per_100g: 15.3, fat_per_100g: 33.5, default_amount: 30, step: 10,
  },
  popcorn: {
    id: 'popcorn', name: 'Popcorn', nameAr: 'فشار', emoji: '🍿', category: 'snacks',
    unit: 'g', kcal_per_100g: 387, protein_per_100g: 13, carbs_per_100g: 77.8, fat_per_100g: 4.5, default_amount: 30, step: 10,
  },
  spiruline: {
    id: 'spiruline', name: 'Spiruline', nameAr: 'سبيرولينا', emoji: '🌿', category: 'snacks',
    unit: 'g', kcal_per_100g: 290, protein_per_100g: 58, carbs_per_100g: 24, fat_per_100g: 7, default_amount: 10, step: 5,
  },
  whey_protein: {
    id: 'whey_protein', name: 'Whey Protein (~30g)', nameAr: 'واي بروتين', emoji: '💪', category: 'snacks',
    unit: 'g', kcal_per_100g: 393, protein_per_100g: 77, carbs_per_100g: 6.7, fat_per_100g: 6.7, default_amount: 30, step: 5,
  },
  coca_cola_zero: {
    id: 'coca_cola_zero', name: 'Coca Cola Zero', nameAr: 'كوكا كولا زيرو', emoji: '🥤', category: 'snacks',
    unit: 'g', kcal_per_100g: 0.3, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0, default_amount: 330, step: 100,
  },

  // ── Laitiers ─────────────────────────────────────────────────────
  lait_demi_ecreme: {
    id: 'lait_demi_ecreme', name: 'Lait demi-écrémé', nameAr: 'حليب نصف دسم', emoji: '🥛', category: 'laitiers',
    unit: 'g', kcal_per_100g: 46, protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 1.5, default_amount: 200, step: 50,
  },
  lait_0: {
    id: 'lait_0', name: 'Lait 0%', nameAr: 'حليب خالي الدسم 0٪', emoji: '🥛', category: 'laitiers',
    unit: 'g', kcal_per_100g: 35, protein_per_100g: 3.4, carbs_per_100g: 4.9, fat_per_100g: 0.2, default_amount: 200, step: 50,
  },
  lait_amande: {
    id: 'lait_amande', name: "Lait d'amande", nameAr: 'حليب اللوز', emoji: '🥛', category: 'laitiers',
    unit: 'g', kcal_per_100g: 22, protein_per_100g: 0.6, carbs_per_100g: 0.3, fat_per_100g: 2, default_amount: 200, step: 50,
  },
  yaourt: {
    id: 'yaourt', name: 'Yaourt', nameAr: 'زبادي', emoji: '🫙', category: 'laitiers',
    unit: 'g', kcal_per_100g: 100, protein_per_100g: 3, carbs_per_100g: 13.3, fat_per_100g: 3.1, default_amount: 125, step: 25,
  },
  yaarout: {
    id: 'yaarout', name: 'Yaourt 0%', nameAr: 'زبادي خالي الدسم 0٪', emoji: '🫙', category: 'laitiers',
    unit: 'pot', kcal_per_unit: 56, protein_per_unit: 5.25, carbs_per_unit: 7.25, fat_per_unit: 0.625, default_amount: 1, step: 1,
  },
  ricotta: {
    id: 'ricotta', name: 'Ricotta', nameAr: 'ريكوتا', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 174, protein_per_100g: 11.3, carbs_per_100g: 3, fat_per_100g: 13, default_amount: 100, step: 25,
  },
  mozzarella: {
    id: 'mozzarella', name: 'Mozzarella', nameAr: 'موتزاريلا', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 250, protein_per_100g: 17.5, carbs_per_100g: 1.5, fat_per_100g: 19, default_amount: 100, step: 25,
  },
  fromage_0: {
    id: 'fromage_0', name: 'Fromage 0%', nameAr: 'جبن خالي الدسم 0٪', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 49, protein_per_100g: 7.7, carbs_per_100g: 4.4, fat_per_100g: 0.1, default_amount: 100, step: 25,
  },
  cheddar: {
    id: 'cheddar', name: 'Cheddar', nameAr: 'شيدر', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 402, protein_per_100g: 24.9, carbs_per_100g: 1.3, fat_per_100g: 33.1, default_amount: 30, step: 10,
  },
  parmesan: {
    id: 'parmesan', name: 'Parmesan', nameAr: 'بارميزان', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 431, protein_per_100g: 38.5, carbs_per_100g: 4.1, fat_per_100g: 28.6, default_amount: 20, step: 5,
  },
  gruyere: {
    id: 'gruyere', name: 'Gruyère', nameAr: 'غرويير', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 414, protein_per_100g: 27.2, carbs_per_100g: 1.4, fat_per_100g: 33.4, default_amount: 30, step: 10,
  },
  gouda: {
    id: 'gouda', name: 'Gouda', nameAr: 'غودا', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 356, protein_per_100g: 24.9, carbs_per_100g: 2.2, fat_per_100g: 27.4, default_amount: 30, step: 10,
  },
  emmental: {
    id: 'emmental', name: 'Emmental', nameAr: 'إيمنتال', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 380, protein_per_100g: 26.9, carbs_per_100g: 5.4, fat_per_100g: 27.8, default_amount: 30, step: 10,
  },
  fromage_chevre: {
    id: 'fromage_chevre', name: 'Fromage de chèvre', nameAr: 'جبن الماعز', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 360, protein_per_100g: 23.5, carbs_per_100g: 1.9, fat_per_100g: 28.9, default_amount: 30, step: 10,
  },
  fromage_freedo: {
    id: 'fromage_freedo', name: 'Fromage Freedo', nameAr: 'جبن فريدو', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 300, protein_per_100g: 14, carbs_per_100g: 2, fat_per_100g: 26, default_amount: 10, step: 5,
  },
  fromage_fondu: {
    id: 'fromage_fondu', name: 'Fromage fondu', nameAr: 'جبن مذاب', emoji: '🧀', category: 'laitiers',
    unit: 'g', kcal_per_100g: 261, protein_per_100g: 9.5, carbs_per_100g: 5, fat_per_100g: 22.6, default_amount: 30, step: 10,
  },
  fromage_slice: {
    id: 'fromage_slice', name: 'Fromage slice', nameAr: 'جبن شرائح', emoji: '🧀', category: 'laitiers',
    unit: 'piece', kcal_per_unit: 49, protein_per_unit: 3.2, carbs_per_unit: 1, fat_per_unit: 3.6, default_amount: 2, step: 1,
  },
  creme_fraiche: {
    id: 'creme_fraiche', name: 'Crème fraîche', nameAr: 'كريمة طازجة', emoji: '🫙', category: 'laitiers',
    unit: 'g', kcal_per_100g: 301, protein_per_100g: 2.3, carbs_per_100g: 2.8, fat_per_100g: 31, default_amount: 30, step: 10,
  },

  // ── Matières grasses ─────────────────────────────────────────────
  huile_olive: {
    id: 'huile_olive', name: "Huile d'olive", nameAr: 'زيت الزيتون', emoji: '🫒', category: 'matieres_grasses',
    unit: 'g', kcal_per_100g: 900, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, default_amount: 10, step: 5,
  },
  huile_tournesol: {
    id: 'huile_tournesol', name: 'Huile de tournesol', nameAr: 'زيت عباد الشمس', emoji: '🌻', category: 'matieres_grasses',
    unit: 'g', kcal_per_100g: 900, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, default_amount: 10, step: 5,
  },
  huile_coco: {
    id: 'huile_coco', name: 'Huile de coco', nameAr: 'زيت جوز الهند', emoji: '🥥', category: 'matieres_grasses',
    unit: 'g', kcal_per_100g: 900, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, default_amount: 10, step: 5,
  },
  beurre: {
    id: 'beurre', name: 'Beurre', nameAr: 'زبدة', emoji: '🧈', category: 'matieres_grasses',
    unit: 'g', kcal_per_100g: 750, protein_per_100g: 1, carbs_per_100g: 1, fat_per_100g: 82, default_amount: 10, step: 5,
  },

  // ── Sucres & Condiments ──────────────────────────────────────────
  sucre_blanc: {
    id: 'sucre_blanc', name: 'Sucre blanc', nameAr: 'سكر أبيض', emoji: '🍬', category: 'sucres',
    unit: 'g', kcal_per_100g: 400, protein_per_100g: 0, carbs_per_100g: 100, fat_per_100g: 0, default_amount: 10, step: 5,
  },
  sucre_brun: {
    id: 'sucre_brun', name: 'Sucre brun', nameAr: 'سكر بني', emoji: '🍬', category: 'sucres',
    unit: 'g', kcal_per_100g: 377, protein_per_100g: 0, carbs_per_100g: 97.3, fat_per_100g: 0, default_amount: 10, step: 5,
  },
  miel: {
    id: 'miel', name: 'Miel', nameAr: 'عسل', emoji: '🍯', category: 'sucres',
    unit: 'g', kcal_per_100g: 307, protein_per_100g: 0.4, carbs_per_100g: 76, fat_per_100g: 0.1, default_amount: 15, step: 5,
  },
  sucre_dattes: {
    id: 'sucre_dattes', name: 'Sucre de dattes', nameAr: 'سكر التمر', emoji: '🟤', category: 'sucres',
    unit: 'g', kcal_per_100g: 363, protein_per_100g: 0, carbs_per_100g: 96, fat_per_100g: 0, default_amount: 10, step: 5,
  },
  levure_chimique: {
    id: 'levure_chimique', name: 'Levure chimique', nameAr: 'مسحوق الخبز', emoji: '🧂', category: 'sucres',
    unit: 'g', kcal_per_100g: 76, protein_per_100g: 0, carbs_per_100g: 19, fat_per_100g: 0, default_amount: 5, step: 1,
  },
};

export const FOOD_CATEGORIES = [
  { key: 'proteines',        label: 'Protéines',           emoji: '💪' },
  { key: 'glucides',         label: 'Glucides',            emoji: '🌾' },
  { key: 'legumes',          label: 'Légumes',             emoji: '🥦' },
  { key: 'fruits',           label: 'Fruits',              emoji: '🍎' },
  { key: 'snacks',           label: 'Snacks & Oléagineux', emoji: '🥜' },
  { key: 'laitiers',         label: 'Laitiers',            emoji: '🥛' },
  { key: 'matieres_grasses', label: 'Matières grasses',    emoji: '🫒' },
  { key: 'sucres',           label: 'Sucres & Condiments', emoji: '🍯' },
];

/** Returns nutrition for one item */
export function getNutrition(foodId, amount) {
  const food = FOODS[foodId];
  if (!food || !amount || amount <= 0) return { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  if (food.unit === 'g') {
    const r = amount / 100;
    return { kcal: food.kcal_per_100g * r, protein_g: food.protein_per_100g * r, carbs_g: food.carbs_per_100g * r, fat_g: food.fat_per_100g * r };
  }
  return { kcal: food.kcal_per_unit * amount, protein_g: food.protein_per_unit * amount, carbs_g: food.carbs_per_unit * amount, fat_g: food.fat_per_unit * amount };
}

/** Sums nutrition for a single meal's item array */
export function sumMealNutrition(items = []) {
  return items.reduce((acc, item) => {
    const n = getNutrition(item.food_id, item.amount);
    return { kcal: acc.kcal + n.kcal, protein_g: acc.protein_g + n.protein_g, carbs_g: acc.carbs_g + n.carbs_g, fat_g: acc.fat_g + n.fat_g };
  }, { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
}

/** Full day totals from all 4 meals */
export function calculateFromMeals(mealsObj = {}) {
  let totalKcal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  const mealDone = {};
  ['meal1', 'meal2', 'meal3', 'meal4'].forEach(key => {
    const items = mealsObj[key] || [];
    mealDone[key] = items.length > 0;
    const n = sumMealNutrition(items);
    totalKcal += n.kcal; totalProtein += n.protein_g; totalCarbs += n.carbs_g; totalFat += n.fat_g;
  });
  return {
    calories_consumed: Math.round(totalKcal),
    protein_g: Math.round(totalProtein),
    carbs_g: Math.round(totalCarbs),
    fat_g: Math.round(totalFat),
    meal1_done: mealDone.meal1,
    meal2_done: mealDone.meal2,
    meal3_done: mealDone.meal3,
    meal4_done: mealDone.meal4,
  };
}
