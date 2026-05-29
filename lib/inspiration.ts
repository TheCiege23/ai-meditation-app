export type InspirationCategory = "quote" | "bible_proverb";

export type InspirationTheme =
  | "hope"
  | "peace"
  | "courage"
  | "strength"
  | "faith"
  | "healing"
  | "purpose"
  | "gratitude"
  | "perseverance";

export type InspirationItem = {
  id: string;
  category: InspirationCategory;
  language: "en" | "es";
  theme: InspirationTheme;
  text: string;
  reference?: string;
};

export const INSPIRATION_ITEMS: InspirationItem[] = [
  // English quotes
  {
    id: "en-quote-hope-1",
    category: "quote",
    language: "en",
    theme: "hope",
    text: "You are growing even in seasons that feel still.",
  },
  {
    id: "en-quote-peace-1",
    category: "quote",
    language: "en",
    theme: "peace",
    text: "Peace often begins with one steady breath.",
  },
  {
    id: "en-quote-faith-1",
    category: "quote",
    language: "en",
    theme: "faith",
    text: "Small steps taken in faith can change everything.",
  },
  {
    id: "en-quote-strength-1",
    category: "quote",
    language: "en",
    theme: "strength",
    text: "Strength is often the quiet choice to keep going gently.",
  },
  {
    id: "en-quote-peace-2",
    category: "quote",
    language: "en",
    theme: "peace",
    text: "You do not have to hurry to heal; peace can move at your pace.",
  },
  {
    id: "en-quote-gratitude-1",
    category: "quote",
    language: "en",
    theme: "gratitude",
    text: "Gratitude turns ordinary moments into quiet sanctuaries.",
  },
  {
    id: "en-quote-perseverance-1",
    category: "quote",
    language: "en",
    theme: "perseverance",
    text: "Every small act of care is a vote for the future you are building.",
  },
  {
    id: "en-quote-healing-1",
    category: "quote",
    language: "en",
    theme: "healing",
    text: "Healing is not about rushing forward, but about meeting yourself kindly where you are.",
  },
  {
    id: "en-quote-courage-1",
    category: "quote",
    language: "en",
    theme: "courage",
    text: "Courage can sound like a soft yes to one more try.",
  },
  {
    id: "en-quote-purpose-1",
    category: "quote",
    language: "en",
    theme: "purpose",
    text: "Your purpose does not need to be loud to be real.",
  },
  {
    id: "en-quote-hope-2",
    category: "quote",
    language: "en",
    theme: "hope",
    text: "Even on heavy days, hope can be the smallest light that refuses to go out.",
  },
  {
    id: "en-quote-peace-3",
    category: "quote",
    language: "en",
    theme: "peace",
    text: "A slower breath, a softer thought, and the room for peace begins to open.",
  },
  {
    id: "en-quote-courage-2",
    category: "quote",
    language: "en",
    theme: "courage",
    text: "You do not have to be fearless to be brave; you only have to be willing.",
  },
  {
    id: "en-quote-strength-2",
    category: "quote",
    language: "en",
    theme: "strength",
    text: "It is strong to rest, to ask for help, and to begin again.",
  },
  {
    id: "en-quote-faith-2",
    category: "quote",
    language: "en",
    theme: "faith",
    text: "Faith often looks like trusting the next step, not the whole path.",
  },
  {
    id: "en-quote-healing-2",
    category: "quote",
    language: "en",
    theme: "healing",
    text: "Your body and heart remember how to heal when you give them gentle space.",
  },
  {
    id: "en-quote-purpose-2",
    category: "quote",
    language: "en",
    theme: "purpose",
    text: "Purpose can hide inside the small acts of love you offer every day.",
  },
  {
    id: "en-quote-gratitude-2",
    category: "quote",
    language: "en",
    theme: "gratitude",
    text: "Noticing one good thing is enough to shift the tone of a day.",
  },
  {
    id: "en-quote-perseverance-2",
    category: "quote",
    language: "en",
    theme: "perseverance",
    text: "On the days you feel slow, remember: slow is still forward.",
  },
  {
    id: "en-quote-hope-3",
    category: "quote",
    language: "en",
    theme: "hope",
    text: "Hope does not erase the storm, but it reminds you there is more to the sky.",
  },

  // Spanish quotes
  {
    id: "es-quote-hope-1",
    category: "quote",
    language: "es",
    theme: "hope",
    text: "Estás creciendo incluso en las temporadas que parecen quietas.",
  },
  {
    id: "es-quote-peace-1",
    category: "quote",
    language: "es",
    theme: "peace",
    text: "La paz muchas veces comienza con una respiración consciente.",
  },
  {
    id: "es-quote-faith-1",
    category: "quote",
    language: "es",
    theme: "faith",
    text: "Los pasos pequeños dados con fe pueden cambiarlo todo.",
  },
  {
    id: "es-quote-strength-1",
    category: "quote",
    language: "es",
    theme: "strength",
    text: "La verdadera fuerza suele ser la decisión silenciosa de seguir con suavidad.",
  },
  {
    id: "es-quote-peace-2",
    category: "quote",
    language: "es",
    theme: "peace",
    text: "No tienes que apresurar tu sanación; la paz puede moverse a tu ritmo.",
  },
  {
    id: "es-quote-gratitude-1",
    category: "quote",
    language: "es",
    theme: "gratitude",
    text: "La gratitud transforma los momentos sencillos en refugios silenciosos.",
  },
  {
    id: "es-quote-perseverance-1",
    category: "quote",
    language: "es",
    theme: "perseverance",
    text: "Cada pequeño gesto de cuidado es un voto por el futuro que estás construyendo.",
  },
  {
    id: "es-quote-healing-1",
    category: "quote",
    language: "es",
    theme: "healing",
    text: "Sanar no es correr hacia adelante, sino encontrarte con ternura donde estás.",
  },
  {
    id: "es-quote-courage-1",
    category: "quote",
    language: "es",
    theme: "courage",
    text: "El valor a veces suena como un suave sí a intentarlo una vez más.",
  },
  {
    id: "es-quote-purpose-1",
    category: "quote",
    language: "es",
    theme: "purpose",
    text: "Tu propósito no necesita ser ruidoso para ser real.",
  },
  {
    id: "es-quote-hope-2",
    category: "quote",
    language: "es",
    theme: "hope",
    text: "Aun en los días pesados, la esperanza puede ser la pequeña luz que se niega a apagarse.",
  },
  {
    id: "es-quote-peace-3",
    category: "quote",
    language: "es",
    theme: "peace",
    text: "Una respiración más lenta y un pensamiento más suave abren la puerta a la calma.",
  },
  {
    id: "es-quote-courage-2",
    category: "quote",
    language: "es",
    theme: "courage",
    text: "No necesitas no tener miedo para ser valiente; solo necesitas estar disponible.",
  },
  {
    id: "es-quote-strength-2",
    category: "quote",
    language: "es",
    theme: "strength",
    text: "También es fuerza descansar, pedir ayuda y comenzar de nuevo.",
  },
  {
    id: "es-quote-faith-2",
    category: "quote",
    language: "es",
    theme: "faith",
    text: "La fe muchas veces se ve como confiar en el siguiente paso, no en todo el camino.",
  },
  {
    id: "es-quote-healing-2",
    category: "quote",
    language: "es",
    theme: "healing",
    text: "Tu cuerpo y tu corazón recuerdan cómo sanar cuando les das un espacio amable.",
  },
  {
    id: "es-quote-purpose-2",
    category: "quote",
    language: "es",
    theme: "purpose",
    text: "El propósito se esconde en los actos pequeños de amor que ofreces cada día.",
  },
  {
    id: "es-quote-gratitude-2",
    category: "quote",
    language: "es",
    theme: "gratitude",
    text: "Notar una sola cosa buena puede cambiar el tono de tu día.",
  },
  {
    id: "es-quote-perseverance-2",
    category: "quote",
    language: "es",
    theme: "perseverance",
    text: "En los días en que te sientes lento, recuerda: lento también es avanzar.",
  },
  {
    id: "es-quote-hope-3",
    category: "quote",
    language: "es",
    theme: "hope",
    text: "La esperanza no borra la tormenta, pero te recuerda que hay más cielo que nubes.",
  },

  // English Bible-based inspiration
  {
    id: "en-bible-faith-1",
    category: "bible_proverb",
    language: "en",
    theme: "faith",
    text: "Be strong and courageous; do not be afraid, for God is with you.",
    reference: "Joshua 1:9",
  },
  {
    id: "en-bible-peace-1",
    category: "bible_proverb",
    language: "en",
    theme: "peace",
    text: "A gentle answer turns away wrath.",
    reference: "Proverbs 15:1",
  },
  {
    id: "en-bible-faith-2",
    category: "bible_proverb",
    language: "en",
    theme: "faith",
    text: "Trust in the Lord with all your heart.",
    reference: "Proverbs 3:5",
  },
  {
    id: "en-bible-hope-1",
    category: "bible_proverb",
    language: "en",
    theme: "hope",
    text: "Those who hope in the Lord renew their strength and rise on wings like eagles.",
    reference: "Isaiah 40:31",
  },
  {
    id: "en-bible-peace-2",
    category: "bible_proverb",
    language: "en",
    theme: "peace",
    text: "The peace of God, beyond understanding, will guard your heart and mind.",
    reference: "Philippians 4:7",
  },
  {
    id: "en-bible-strength-1",
    category: "bible_proverb",
    language: "en",
    theme: "strength",
    text: "The joy of the Lord is your strength when you feel weary.",
    reference: "Nehemiah 8:10",
  },
  {
    id: "en-bible-gratitude-1",
    category: "bible_proverb",
    language: "en",
    theme: "gratitude",
    text: "Give thanks in every season, for gratitude keeps your heart awake.",
    reference: "1 Thessalonians 5:18",
  },
  {
    id: "en-bible-perseverance-1",
    category: "bible_proverb",
    language: "en",
    theme: "perseverance",
    text: "Do not grow tired of doing good; in due time you will reap a harvest.",
    reference: "Galatians 6:9",
  },
  {
    id: "en-bible-healing-1",
    category: "bible_proverb",
    language: "en",
    theme: "healing",
    text: "God heals the brokenhearted and binds up their wounds.",
    reference: "Psalm 147:3",
  },
  {
    id: "en-bible-courage-1",
    category: "bible_proverb",
    language: "en",
    theme: "courage",
    text: "When you pass through deep waters, you are not alone.",
    reference: "Isaiah 43:2",
  },
  {
    id: "en-bible-purpose-1",
    category: "bible_proverb",
    language: "en",
    theme: "purpose",
    text: "You are God’s workmanship, created for good works prepared in advance for you.",
    reference: "Ephesians 2:10",
  },
  {
    id: "en-bible-hope-2",
    category: "bible_proverb",
    language: "en",
    theme: "hope",
    text: "God’s mercies are new every morning; hope returns with each sunrise.",
    reference: "Lamentations 3:22-23",
  },
  {
    id: "en-bible-peace-3",
    category: "bible_proverb",
    language: "en",
    theme: "peace",
    text: "Blessed are the peacemakers; they carry the heart of God into tense places.",
    reference: "Matthew 5:9",
  },
  {
    id: "en-bible-strength-2",
    category: "bible_proverb",
    language: "en",
    theme: "strength",
    text: "You can do all things through Christ who strengthens you.",
    reference: "Philippians 4:13",
  },
  {
    id: "en-bible-faith-3",
    category: "bible_proverb",
    language: "en",
    theme: "faith",
    text: "Walk by faith, not by sight, trusting the One who sees the whole way.",
    reference: "2 Corinthians 5:7",
  },
  {
    id: "en-bible-healing-2",
    category: "bible_proverb",
    language: "en",
    theme: "healing",
    text: "A cheerful heart is good medicine for a weary soul.",
    reference: "Proverbs 17:22",
  },
  {
    id: "en-bible-purpose-2",
    category: "bible_proverb",
    language: "en",
    theme: "purpose",
    text: "In all your ways, acknowledge God, and He will make your paths straight.",
    reference: "Proverbs 3:6",
  },
  {
    id: "en-bible-gratitude-2",
    category: "bible_proverb",
    language: "en",
    theme: "gratitude",
    text: "Every good and perfect gift is from above; notice the gifts around you.",
    reference: "James 1:17",
  },
  {
    id: "en-bible-perseverance-2",
    category: "bible_proverb",
    language: "en",
    theme: "perseverance",
    text: "Suffering can grow perseverance, character, and a hope that does not disappoint.",
    reference: "Romans 5:3-5",
  },
  {
    id: "en-bible-hope-3",
    category: "bible_proverb",
    language: "en",
    theme: "hope",
    text: "God is near to all who call on Him in truth, even in quiet whispers.",
    reference: "Psalm 145:18",
  },

  // Spanish Bible-based inspiration
  {
    id: "es-bible-faith-1",
    category: "bible_proverb",
    language: "es",
    theme: "faith",
    text: "Sé fuerte y valiente; no tengas miedo, porque Dios está contigo.",
    reference: "Josué 1:9",
  },
  {
    id: "es-bible-peace-1",
    category: "bible_proverb",
    language: "es",
    theme: "peace",
    text: "La blanda respuesta quita la ira.",
    reference: "Proverbios 15:1",
  },
  {
    id: "es-bible-faith-2",
    category: "bible_proverb",
    language: "es",
    theme: "faith",
    text: "Confía en el Señor con todo tu corazón.",
    reference: "Proverbios 3:5",
  },
  {
    id: "es-bible-hope-1",
    category: "bible_proverb",
    language: "es",
    theme: "hope",
    text: "Los que esperan en el Señor renuevan sus fuerzas y se elevan como águilas.",
    reference: "Isaías 40:31",
  },
  {
    id: "es-bible-peace-2",
    category: "bible_proverb",
    language: "es",
    theme: "peace",
    text: "La paz de Dios, que sobrepasa todo entendimiento, guardará tu corazón y tu mente.",
    reference: "Filipenses 4:7",
  },
  {
    id: "es-bible-strength-1",
    category: "bible_proverb",
    language: "es",
    theme: "strength",
    text: "El gozo del Señor es tu fuerza cuando te sientes cansado.",
    reference: "Nehemías 8:10",
  },
  {
    id: "es-bible-gratitude-1",
    category: "bible_proverb",
    language: "es",
    theme: "gratitude",
    text: "Da gracias en todo tiempo; la gratitud mantiene despierto tu corazón.",
    reference: "1 Tesalonicenses 5:18",
  },
  {
    id: "es-bible-perseverance-1",
    category: "bible_proverb",
    language: "es",
    theme: "perseverance",
    text: "No te canses de hacer el bien; a su tiempo segarás si no te rindes.",
    reference: "Gálatas 6:9",
  },
  {
    id: "es-bible-healing-1",
    category: "bible_proverb",
    language: "es",
    theme: "healing",
    text: "Dios sana a los quebrantados de corazón y venda sus heridas.",
    reference: "Salmo 147:3",
  },
  {
    id: "es-bible-courage-1",
    category: "bible_proverb",
    language: "es",
    theme: "courage",
    text: "Cuando pases por aguas profundas, no estarás solo.",
    reference: "Isaías 43:2",
  },
  {
    id: "es-bible-purpose-1",
    category: "bible_proverb",
    language: "es",
    theme: "purpose",
    text: "Eres hechura de Dios, creado para buenas obras preparadas de antemano.",
    reference: "Efesios 2:10",
  },
  {
    id: "es-bible-hope-2",
    category: "bible_proverb",
    language: "es",
    theme: "hope",
    text: "Las misericordias de Dios se renuevan cada mañana; con cada amanecer vuelve la esperanza.",
    reference: "Lamentaciones 3:22-23",
  },
  {
    id: "es-bible-peace-3",
    category: "bible_proverb",
    language: "es",
    theme: "peace",
    text: "Bienaventurados los pacificadores; llevan el corazón de Dios a los lugares tensos.",
    reference: "Mateo 5:9",
  },
  {
    id: "es-bible-strength-2",
    category: "bible_proverb",
    language: "es",
    theme: "strength",
    text: "Todo lo puedes en Cristo que te fortalece.",
    reference: "Filipenses 4:13",
  },
  {
    id: "es-bible-faith-3",
    category: "bible_proverb",
    language: "es",
    theme: "faith",
    text: "Camina por fe y no por vista, confiando en Aquel que ve todo el camino.",
    reference: "2 Corintios 5:7",
  },
  {
    id: "es-bible-healing-2",
    category: "bible_proverb",
    language: "es",
    theme: "healing",
    text: "El corazón alegre es buena medicina para el alma cansada.",
    reference: "Proverbios 17:22",
  },
  {
    id: "es-bible-purpose-2",
    category: "bible_proverb",
    language: "es",
    theme: "purpose",
    text: "Reconócelo en todos tus caminos, y Él enderezará tus sendas.",
    reference: "Proverbios 3:6",
  },
  {
    id: "es-bible-gratitude-2",
    category: "bible_proverb",
    language: "es",
    theme: "gratitude",
    text: "Toda buena dádiva y todo don perfecto descienden de lo alto; nota los regalos a tu alrededor.",
    reference: "Santiago 1:17",
  },
  {
    id: "es-bible-perseverance-2",
    category: "bible_proverb",
    language: "es",
    theme: "perseverance",
    text: "La prueba produce paciencia, carácter y una esperanza que no defrauda.",
    reference: "Romanos 5:3-5",
  },
  {
    id: "es-bible-hope-3",
    category: "bible_proverb",
    language: "es",
    theme: "hope",
    text: "Dios está cerca de todos los que lo invocan de verdad, incluso en suspiros silenciosos.",
    reference: "Salmo 145:18",
  },
];

export function getInspirationsByLanguage(language: "en" | "es") {
  return INSPIRATION_ITEMS.filter((item) => item.language === language);
}

export function getInspirationsByCategory(language: "en" | "es", category: InspirationCategory) {
  return INSPIRATION_ITEMS.filter((item) => item.language === language && item.category === category);
}

export function getInspirationsByTheme(language: "en" | "es", theme: InspirationTheme) {
  return INSPIRATION_ITEMS.filter((item) => item.language === language && item.theme === theme);
}

export function getRandomInspiration(input: {
  language: "en" | "es";
  category?: InspirationCategory;
  theme?: InspirationTheme;
}): InspirationItem | null {
  const primary = INSPIRATION_ITEMS.filter((item) => {
    if (item.language !== input.language) return false;
    if (input.category && item.category !== input.category) return false;
    if (input.theme && item.theme !== input.theme) return false;
    return true;
  });

  const fallback = INSPIRATION_ITEMS.filter((item) => {
    if (item.language !== "en") return false;
    if (input.category && item.category !== input.category) return false;
    if (input.theme && item.theme !== input.theme) return false;
    return true;
  });

  const pool = primary.length > 0 ? primary : fallback;
  if (pool.length === 0) return null;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? null;
}


