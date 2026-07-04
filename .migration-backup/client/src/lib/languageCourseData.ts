/**
 * Language Course Data
 * Structured vocabulary, phrases, and grammar notes for
 * Spanish (es), French (fr), German (de), and Chinese Simplified (zh).
 * Used by languageCourseGenerator.ts to build procedurally generated lessons.
 */

export type LangCode = 'es' | 'fr' | 'de' | 'zh';

export interface VocabEntry {
  english: string;
  es: string;
  fr: string;
  de: string;
  zh: string;         // simplified character(s)
  zhPinyin: string;   // pinyin romanization
  category: string;
}

export interface PhraseEntry {
  english: string;
  es: string;
  fr: string;
  de: string;
  zh: string;
  zhPinyin: string;
  context?: string;  // usage note
}

export interface GrammarNote {
  title: string;
  explanation: Record<LangCode, string>;  // explanation in each language's context
}

// ─── LANGUAGE METADATA ─────────────────────────────────────────────────────

export interface LangMeta {
  code: LangCode;
  name: string;
  nativeName: string;
  flag: string;
  family: string;
  speakers: string;
  writingSystem: string;
  difficulty: 'A' | 'B' | 'C';  // A=easy, C=harder for English speakers
  color: string;
}

export const LANG_META: Record<LangCode, LangMeta> = {
  es: { code: 'es', name: 'Spanish',            nativeName: 'Español',    flag: '🇪🇸', family: 'Romance',  speakers: '485M',  writingSystem: 'Latin', difficulty: 'A', color: '#ff6b35' },
  fr: { code: 'fr', name: 'French',             nativeName: 'Français',   flag: '🇫🇷', family: 'Romance',  speakers: '280M',  writingSystem: 'Latin', difficulty: 'A', color: '#4b9cdb' },
  de: { code: 'de', name: 'German',             nativeName: 'Deutsch',    flag: '🇩🇪', family: 'Germanic', speakers: '95M',   writingSystem: 'Latin', difficulty: 'B', color: '#f5a623' },
  zh: { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文',     flag: '🇨🇳', family: 'Sino-Tibetan', speakers: '920M', writingSystem: 'Hanzi', difficulty: 'C', color: '#e74c3c' },
};

// ─── VOCABULARY TABLES ─────────────────────────────────────────────────────

export const VOCAB_GREETINGS: VocabEntry[] = [
  { english: 'hello',        es: 'hola',          fr: 'bonjour',      de: 'hallo',        zh: '你好',   zhPinyin: 'nǐ hǎo',      category: 'greetings' },
  { english: 'goodbye',      es: 'adiós',         fr: 'au revoir',    de: 'auf Wiedersehen', zh: '再见', zhPinyin: 'zài jiàn',    category: 'greetings' },
  { english: 'good morning', es: 'buenos días',   fr: 'bonjour',      de: 'guten Morgen', zh: '早上好', zhPinyin: 'zǎoshang hǎo', category: 'greetings' },
  { english: 'good night',   es: 'buenas noches', fr: 'bonne nuit',   de: 'gute Nacht',   zh: '晚安',   zhPinyin: 'wǎn ān',      category: 'greetings' },
  { english: 'please',       es: 'por favor',     fr: 's\'il vous plaît', de: 'bitte',    zh: '请',     zhPinyin: 'qǐng',        category: 'greetings' },
  { english: 'thank you',    es: 'gracias',       fr: 'merci',        de: 'danke',        zh: '谢谢',   zhPinyin: 'xiè xiè',     category: 'greetings' },
  { english: 'you\'re welcome', es: 'de nada',    fr: 'de rien',      de: 'bitte',        zh: '不客气', zhPinyin: 'bù kèqi',     category: 'greetings' },
  { english: 'sorry',        es: 'lo siento',     fr: 'désolé',       de: 'es tut mir leid', zh: '对不起', zhPinyin: 'duì bu qǐ', category: 'greetings' },
  { english: 'excuse me',    es: 'perdón',        fr: 'excusez-moi',  de: 'Entschuldigung', zh: '打扰一下', zhPinyin: 'dǎrǎo yīxià', category: 'greetings' },
  { english: 'yes',          es: 'sí',            fr: 'oui',          de: 'ja',           zh: '是',     zhPinyin: 'shì',         category: 'greetings' },
  { english: 'no',           es: 'no',            fr: 'non',          de: 'nein',         zh: '不',     zhPinyin: 'bù',          category: 'greetings' },
  { english: 'how are you?', es: '¿cómo estás?',  fr: 'comment allez-vous?', de: 'wie geht es Ihnen?', zh: '你好吗？', zhPinyin: 'nǐ hǎo ma?', category: 'greetings' },
  { english: 'my name is',   es: 'me llamo',      fr: 'je m\'appelle', de: 'ich heiße',  zh: '我叫',   zhPinyin: 'wǒ jiào',     category: 'greetings' },
  { english: 'nice to meet you', es: 'mucho gusto', fr: 'enchanté',  de: 'freut mich',   zh: '很高兴认识你', zhPinyin: 'hěn gāoxìng rènshi nǐ', category: 'greetings' },
];

export const VOCAB_NUMBERS: VocabEntry[] = [
  { english: 'one',    es: 'uno',    fr: 'un',     de: 'eins',   zh: '一', zhPinyin: 'yī',   category: 'numbers' },
  { english: 'two',    es: 'dos',    fr: 'deux',   de: 'zwei',   zh: '二', zhPinyin: 'èr',   category: 'numbers' },
  { english: 'three',  es: 'tres',   fr: 'trois',  de: 'drei',   zh: '三', zhPinyin: 'sān',  category: 'numbers' },
  { english: 'four',   es: 'cuatro', fr: 'quatre', de: 'vier',   zh: '四', zhPinyin: 'sì',   category: 'numbers' },
  { english: 'five',   es: 'cinco',  fr: 'cinq',   de: 'fünf',   zh: '五', zhPinyin: 'wǔ',   category: 'numbers' },
  { english: 'six',    es: 'seis',   fr: 'six',    de: 'sechs',  zh: '六', zhPinyin: 'liù',  category: 'numbers' },
  { english: 'seven',  es: 'siete',  fr: 'sept',   de: 'sieben', zh: '七', zhPinyin: 'qī',   category: 'numbers' },
  { english: 'eight',  es: 'ocho',   fr: 'huit',   de: 'acht',   zh: '八', zhPinyin: 'bā',   category: 'numbers' },
  { english: 'nine',   es: 'nueve',  fr: 'neuf',   de: 'neun',   zh: '九', zhPinyin: 'jiǔ',  category: 'numbers' },
  { english: 'ten',    es: 'diez',   fr: 'dix',    de: 'zehn',   zh: '十', zhPinyin: 'shí',  category: 'numbers' },
  { english: 'twenty', es: 'veinte', fr: 'vingt',  de: 'zwanzig',zh: '二十',zhPinyin: 'èrshí', category: 'numbers' },
  { english: 'fifty',  es: 'cincuenta', fr: 'cinquante', de: 'fünfzig', zh: '五十', zhPinyin: 'wǔshí', category: 'numbers' },
  { english: 'hundred',es: 'cien',   fr: 'cent',   de: 'hundert',zh: '百', zhPinyin: 'bǎi',  category: 'numbers' },
  { english: 'zero',   es: 'cero',   fr: 'zéro',   de: 'null',   zh: '零', zhPinyin: 'líng', category: 'numbers' },
];

export const VOCAB_DAYS: VocabEntry[] = [
  { english: 'Monday',    es: 'lunes',     fr: 'lundi',    de: 'Montag',     zh: '星期一', zhPinyin: 'xīngqī yī',   category: 'days' },
  { english: 'Tuesday',   es: 'martes',    fr: 'mardi',    de: 'Dienstag',   zh: '星期二', zhPinyin: 'xīngqī èr',   category: 'days' },
  { english: 'Wednesday', es: 'miércoles', fr: 'mercredi', de: 'Mittwoch',   zh: '星期三', zhPinyin: 'xīngqī sān',  category: 'days' },
  { english: 'Thursday',  es: 'jueves',    fr: 'jeudi',    de: 'Donnerstag', zh: '星期四', zhPinyin: 'xīngqī sì',   category: 'days' },
  { english: 'Friday',    es: 'viernes',   fr: 'vendredi', de: 'Freitag',    zh: '星期五', zhPinyin: 'xīngqī wǔ',   category: 'days' },
  { english: 'Saturday',  es: 'sábado',    fr: 'samedi',   de: 'Samstag',    zh: '星期六', zhPinyin: 'xīngqī liù',  category: 'days' },
  { english: 'Sunday',    es: 'domingo',   fr: 'dimanche', de: 'Sonntag',    zh: '星期天', zhPinyin: 'xīngqī tiān', category: 'days' },
  { english: 'today',     es: 'hoy',       fr: 'aujourd\'hui', de: 'heute',  zh: '今天',   zhPinyin: 'jīn tiān',    category: 'days' },
  { english: 'tomorrow',  es: 'mañana',    fr: 'demain',   de: 'morgen',     zh: '明天',   zhPinyin: 'míng tiān',   category: 'days' },
  { english: 'yesterday', es: 'ayer',      fr: 'hier',     de: 'gestern',    zh: '昨天',   zhPinyin: 'zuó tiān',    category: 'days' },
];

export const VOCAB_COLORS: VocabEntry[] = [
  { english: 'red',    es: 'rojo',     fr: 'rouge',  de: 'rot',     zh: '红色', zhPinyin: 'hóng sè', category: 'colors' },
  { english: 'blue',   es: 'azul',     fr: 'bleu',   de: 'blau',    zh: '蓝色', zhPinyin: 'lán sè',  category: 'colors' },
  { english: 'green',  es: 'verde',    fr: 'vert',   de: 'grün',    zh: '绿色', zhPinyin: 'lǜ sè',   category: 'colors' },
  { english: 'yellow', es: 'amarillo', fr: 'jaune',  de: 'gelb',    zh: '黄色', zhPinyin: 'huáng sè', category: 'colors' },
  { english: 'black',  es: 'negro',    fr: 'noir',   de: 'schwarz', zh: '黑色', zhPinyin: 'hēi sè',  category: 'colors' },
  { english: 'white',  es: 'blanco',   fr: 'blanc',  de: 'weiß',    zh: '白色', zhPinyin: 'bái sè',  category: 'colors' },
  { english: 'orange', es: 'naranja',  fr: 'orange', de: 'orange',  zh: '橙色', zhPinyin: 'chéng sè', category: 'colors' },
  { english: 'purple', es: 'morado',   fr: 'violet', de: 'lila',    zh: '紫色', zhPinyin: 'zǐ sè',   category: 'colors' },
  { english: 'pink',   es: 'rosa',     fr: 'rose',   de: 'rosa',    zh: '粉色', zhPinyin: 'fěn sè',  category: 'colors' },
  { english: 'gray',   es: 'gris',     fr: 'gris',   de: 'grau',    zh: '灰色', zhPinyin: 'huī sè',  category: 'colors' },
];

export const VOCAB_ADJECTIVES: VocabEntry[] = [
  { english: 'big',      es: 'grande',  fr: 'grand',   de: 'groß',    zh: '大',   zhPinyin: 'dà',     category: 'adjectives' },
  { english: 'small',    es: 'pequeño', fr: 'petit',   de: 'klein',   zh: '小',   zhPinyin: 'xiǎo',   category: 'adjectives' },
  { english: 'good',     es: 'bueno',   fr: 'bon',     de: 'gut',     zh: '好',   zhPinyin: 'hǎo',    category: 'adjectives' },
  { english: 'bad',      es: 'malo',    fr: 'mauvais', de: 'schlecht',zh: '坏',   zhPinyin: 'huài',   category: 'adjectives' },
  { english: 'new',      es: 'nuevo',   fr: 'nouveau', de: 'neu',     zh: '新',   zhPinyin: 'xīn',    category: 'adjectives' },
  { english: 'old',      es: 'viejo',   fr: 'vieux',   de: 'alt',     zh: '旧',   zhPinyin: 'jiù',    category: 'adjectives' },
  { english: 'fast',     es: 'rápido',  fr: 'rapide',  de: 'schnell', zh: '快',   zhPinyin: 'kuài',   category: 'adjectives' },
  { english: 'slow',     es: 'lento',   fr: 'lent',    de: 'langsam', zh: '慢',   zhPinyin: 'màn',    category: 'adjectives' },
  { english: 'hot',      es: 'caliente',fr: 'chaud',   de: 'heiß',    zh: '热',   zhPinyin: 'rè',     category: 'adjectives' },
  { english: 'cold',     es: 'frío',    fr: 'froid',   de: 'kalt',    zh: '冷',   zhPinyin: 'lěng',   category: 'adjectives' },
  { english: 'happy',    es: 'feliz',   fr: 'heureux', de: 'glücklich', zh: '快乐', zhPinyin: 'kuàilè', category: 'adjectives' },
  { english: 'tired',    es: 'cansado', fr: 'fatigué', de: 'müde',    zh: '累',   zhPinyin: 'lèi',    category: 'adjectives' },
  { english: 'hungry',   es: 'hambriento', fr: 'affamé', de: 'hungrig', zh: '饿', zhPinyin: 'è',      category: 'adjectives' },
  { english: 'beautiful',es: 'hermoso', fr: 'beau',    de: 'schön',   zh: '美',   zhPinyin: 'měi',    category: 'adjectives' },
];

export const VOCAB_FOOD: VocabEntry[] = [
  { english: 'water',   es: 'agua',    fr: 'eau',      de: 'Wasser',  zh: '水',  zhPinyin: 'shuǐ',  category: 'food' },
  { english: 'bread',   es: 'pan',     fr: 'pain',     de: 'Brot',    zh: '面包', zhPinyin: 'miàn bāo', category: 'food' },
  { english: 'rice',    es: 'arroz',   fr: 'riz',      de: 'Reis',    zh: '米饭', zhPinyin: 'mǐ fàn', category: 'food' },
  { english: 'chicken', es: 'pollo',   fr: 'poulet',   de: 'Hähnchen',zh: '鸡肉', zhPinyin: 'jī ròu', category: 'food' },
  { english: 'fish',    es: 'pescado', fr: 'poisson',  de: 'Fisch',   zh: '鱼',  zhPinyin: 'yú',    category: 'food' },
  { english: 'apple',   es: 'manzana', fr: 'pomme',    de: 'Apfel',   zh: '苹果', zhPinyin: 'píng guǒ', category: 'food' },
  { english: 'milk',    es: 'leche',   fr: 'lait',     de: 'Milch',   zh: '牛奶', zhPinyin: 'niú nǎi', category: 'food' },
  { english: 'egg',     es: 'huevo',   fr: 'œuf',      de: 'Ei',      zh: '鸡蛋', zhPinyin: 'jī dàn', category: 'food' },
  { english: 'coffee',  es: 'café',    fr: 'café',     de: 'Kaffee',  zh: '咖啡', zhPinyin: 'kā fēi', category: 'food' },
  { english: 'tea',     es: 'té',      fr: 'thé',      de: 'Tee',     zh: '茶',  zhPinyin: 'chá',   category: 'food' },
  { english: 'soup',    es: 'sopa',    fr: 'soupe',    de: 'Suppe',   zh: '汤',  zhPinyin: 'tāng',  category: 'food' },
  { english: 'meat',    es: 'carne',   fr: 'viande',   de: 'Fleisch', zh: '肉',  zhPinyin: 'ròu',   category: 'food' },
  { english: 'vegetables', es: 'verduras', fr: 'légumes', de: 'Gemüse', zh: '蔬菜', zhPinyin: 'shū cài', category: 'food' },
  { english: 'fruit',   es: 'fruta',   fr: 'fruit',    de: 'Obst',    zh: '水果', zhPinyin: 'shuǐ guǒ', category: 'food' },
];

export const VOCAB_PLACES: VocabEntry[] = [
  { english: 'school',   es: 'escuela',  fr: 'école',     de: 'Schule',   zh: '学校', zhPinyin: 'xué xiào', category: 'places' },
  { english: 'library',  es: 'biblioteca', fr: 'bibliothèque', de: 'Bibliothek', zh: '图书馆', zhPinyin: 'tú shū guǎn', category: 'places' },
  { english: 'hospital', es: 'hospital', fr: 'hôpital',   de: 'Krankenhaus', zh: '医院', zhPinyin: 'yī yuàn', category: 'places' },
  { english: 'store',    es: 'tienda',   fr: 'magasin',   de: 'Geschäft', zh: '商店', zhPinyin: 'shāng diàn', category: 'places' },
  { english: 'restaurant', es: 'restaurante', fr: 'restaurant', de: 'Restaurant', zh: '餐厅', zhPinyin: 'cān tīng', category: 'places' },
  { english: 'bank',     es: 'banco',    fr: 'banque',    de: 'Bank',     zh: '银行', zhPinyin: 'yín háng', category: 'places' },
  { english: 'park',     es: 'parque',   fr: 'parc',      de: 'Park',     zh: '公园', zhPinyin: 'gōng yuán', category: 'places' },
  { english: 'home',     es: 'casa',     fr: 'maison',    de: 'Haus',     zh: '家',  zhPinyin: 'jiā',      category: 'places' },
  { english: 'airport',  es: 'aeropuerto', fr: 'aéroport', de: 'Flughafen', zh: '机场', zhPinyin: 'jī chǎng', category: 'places' },
  { english: 'hotel',    es: 'hotel',    fr: 'hôtel',     de: 'Hotel',    zh: '酒店', zhPinyin: 'jiǔ diàn', category: 'places' },
];

export const VOCAB_VERBS: VocabEntry[] = [
  { english: 'to be',    es: 'ser/estar', fr: 'être',     de: 'sein',     zh: '是',  zhPinyin: 'shì',    category: 'verbs' },
  { english: 'to have',  es: 'tener',     fr: 'avoir',    de: 'haben',    zh: '有',  zhPinyin: 'yǒu',    category: 'verbs' },
  { english: 'to go',    es: 'ir',        fr: 'aller',    de: 'gehen',    zh: '去',  zhPinyin: 'qù',     category: 'verbs' },
  { english: 'to eat',   es: 'comer',     fr: 'manger',   de: 'essen',    zh: '吃',  zhPinyin: 'chī',    category: 'verbs' },
  { english: 'to drink', es: 'beber',     fr: 'boire',    de: 'trinken',  zh: '喝',  zhPinyin: 'hē',     category: 'verbs' },
  { english: 'to speak', es: 'hablar',    fr: 'parler',   de: 'sprechen', zh: '说',  zhPinyin: 'shuō',   category: 'verbs' },
  { english: 'to know',  es: 'saber',     fr: 'savoir',   de: 'wissen',   zh: '知道', zhPinyin: 'zhī dào', category: 'verbs' },
  { english: 'to want',  es: 'querer',    fr: 'vouloir',  de: 'wollen',   zh: '想要', zhPinyin: 'xiǎng yào', category: 'verbs' },
  { english: 'to see',   es: 'ver',       fr: 'voir',     de: 'sehen',    zh: '看',  zhPinyin: 'kàn',    category: 'verbs' },
  { english: 'to come',  es: 'venir',     fr: 'venir',    de: 'kommen',   zh: '来',  zhPinyin: 'lái',    category: 'verbs' },
  { english: 'to buy',   es: 'comprar',   fr: 'acheter',  de: 'kaufen',   zh: '买',  zhPinyin: 'mǎi',    category: 'verbs' },
  { english: 'to study', es: 'estudiar',  fr: 'étudier',  de: 'lernen',   zh: '学习', zhPinyin: 'xué xí', category: 'verbs' },
  { english: 'to work',  es: 'trabajar',  fr: 'travailler', de: 'arbeiten', zh: '工作', zhPinyin: 'gōng zuò', category: 'verbs' },
  { english: 'to sleep', es: 'dormir',    fr: 'dormir',   de: 'schlafen', zh: '睡觉', zhPinyin: 'shuì jiào', category: 'verbs' },
];

export const VOCAB_PRONOUNS: VocabEntry[] = [
  { english: 'I',      es: 'yo',       fr: 'je',    de: 'ich',  zh: '我',   zhPinyin: 'wǒ',    category: 'pronouns' },
  { english: 'you',    es: 'tú/usted', fr: 'tu/vous', de: 'du/Sie', zh: '你/您', zhPinyin: 'nǐ/nín', category: 'pronouns' },
  { english: 'he',     es: 'él',       fr: 'il',    de: 'er',   zh: '他',   zhPinyin: 'tā',    category: 'pronouns' },
  { english: 'she',    es: 'ella',     fr: 'elle',  de: 'sie',  zh: '她',   zhPinyin: 'tā',    category: 'pronouns' },
  { english: 'we',     es: 'nosotros', fr: 'nous',  de: 'wir',  zh: '我们', zhPinyin: 'wǒ men', category: 'pronouns' },
  { english: 'they',   es: 'ellos',    fr: 'ils',   de: 'sie',  zh: '他们', zhPinyin: 'tā men', category: 'pronouns' },
];

// ─── COMMON PHRASES ─────────────────────────────────────────────────────────

export const PHRASES_SURVIVAL: PhraseEntry[] = [
  { english: 'Where is the bathroom?', es: '¿Dónde está el baño?', fr: 'Où sont les toilettes?', de: 'Wo ist die Toilette?', zh: '洗手间在哪里？', zhPinyin: 'xǐ shǒu jiān zài nǎlǐ?', context: 'essential travel' },
  { english: 'How much does it cost?', es: '¿Cuánto cuesta?', fr: 'Combien ça coûte?', de: 'Wie viel kostet das?', zh: '多少钱？', zhPinyin: 'duō shǎo qián?', context: 'shopping' },
  { english: 'I don\'t understand.', es: 'No entiendo.', fr: 'Je ne comprends pas.', de: 'Ich verstehe nicht.', zh: '我听不懂。', zhPinyin: 'wǒ tīng bù dǒng.', context: 'communication' },
  { english: 'Do you speak English?', es: '¿Habla inglés?', fr: 'Parlez-vous anglais?', de: 'Sprechen Sie Englisch?', zh: '你会说英语吗？', zhPinyin: 'nǐ huì shuō yīngyǔ ma?', context: 'communication' },
  { english: 'I need help.', es: 'Necesito ayuda.', fr: 'J\'ai besoin d\'aide.', de: 'Ich brauche Hilfe.', zh: '我需要帮助。', zhPinyin: 'wǒ xūyào bāngzhù.', context: 'emergency' },
  { english: 'Can I have the bill?', es: '¿Me puede traer la cuenta?', fr: 'L\'addition, s\'il vous plaît.', de: 'Die Rechnung, bitte.', zh: '买单，谢谢。', zhPinyin: 'mǎi dān, xiè xiè.', context: 'restaurant' },
  { english: 'I would like...', es: 'Quisiera...', fr: 'Je voudrais...', de: 'Ich hätte gerne...', zh: '我想要...', zhPinyin: 'wǒ xiǎng yào...', context: 'ordering' },
  { english: 'My name is [name].', es: 'Me llamo [nombre].', fr: 'Je m\'appelle [prénom].', de: 'Ich heiße [Name].', zh: '我叫[名字]。', zhPinyin: 'wǒ jiào [míngzi].', context: 'introduction' },
];

export const PHRASES_TRAVEL: PhraseEntry[] = [
  { english: 'Where is the train station?', es: '¿Dónde está la estación de tren?', fr: 'Où est la gare?', de: 'Wo ist der Bahnhof?', zh: '火车站在哪里？', zhPinyin: 'huǒ chē zhàn zài nǎlǐ?', context: 'transport' },
  { english: 'A ticket to [city], please.', es: 'Un billete a [ciudad], por favor.', fr: 'Un billet pour [ville], s\'il vous plaît.', de: 'Eine Fahrkarte nach [Stadt], bitte.', zh: '一张去[城市]的票，谢谢。', zhPinyin: 'yī zhāng qù [chéngshì] de piào, xiè xiè.', context: 'transport' },
  { english: 'Turn left / Turn right', es: 'Gire a la izquierda / Gire a la derecha', fr: 'Tournez à gauche / Tournez à droite', de: 'Links abbiegen / Rechts abbiegen', zh: '向左转 / 向右转', zhPinyin: 'xiàng zuǒ zhuǎn / xiàng yòu zhuǎn', context: 'directions' },
  { english: 'I have a reservation.', es: 'Tengo una reservación.', fr: 'J\'ai une réservation.', de: 'Ich habe eine Reservierung.', zh: '我有预订。', zhPinyin: 'wǒ yǒu yù dìng.', context: 'hotel' },
];

// ─── GRAMMAR SNAPSHOTS ──────────────────────────────────────────────────────

export interface GrammarSnapshot {
  title: string;
  content: Record<LangCode, string>;  // full grammar note per language
}

export const GRAMMAR_ARTICLES: GrammarSnapshot = {
  title: 'Articles (Definite & Indefinite)',
  content: {
    es: `SPANISH ARTICLES
Definite (the):
• el (masculine singular): el libro — the book
• la (feminine singular): la casa — the house
• los (masculine plural): los libros — the books
• las (feminine plural): las casas — the houses

Indefinite (a/an):
• un (masculine): un perro — a dog
• una (feminine): una gata — a cat
• unos (m. plural): unos libros — some books
• unas (f. plural): unas casas — some houses

TIP: Every noun has a gender. Nouns ending in -o are usually masculine; nouns ending in -a are usually feminine.`,

    fr: `FRENCH ARTICLES
Definite (the):
• le (masculine singular): le livre — the book
• la (feminine singular): la maison — the house
• les (plural, all genders): les livres — the books
• l' (before vowels): l'homme — the man

Indefinite (a/an):
• un (masculine): un chien — a dog
• une (feminine): une maison — a house
• des (plural): des livres — some books

TIP: French has nasal vowels and silent final consonants. La + la → l'; le + le → l'.`,

    de: `GERMAN ARTICLES
Definite (the) — changes by gender AND case:
• der (masculine, nominative): der Mann — the man
• die (feminine, nominative): die Frau — the woman
• das (neuter, nominative): das Kind — the child
• die (plural, all genders): die Kinder — the children

Indefinite (a/an):
• ein (masculine): ein Mann — a man
• eine (feminine): eine Frau — a woman
• ein (neuter): ein Kind — a child

TIP: German has 3 grammatical genders + 4 cases (nominative, accusative, dative, genitive). Articles change in each case — this is one of German's biggest challenges.`,

    zh: `CHINESE — NO ARTICLES
Chinese has no equivalent of "the" or "a/an."
Context and measure words serve a similar function.

MEASURE WORDS (量词 liàngcí):
Every noun has a specific measure word used when counting:
• 一个人 (yī gè rén) — one person (个 is the general measure word)
• 一本书 (yī běn shū) — one book (本 for bound objects)
• 一张桌子 (yī zhāng zhuōzi) — one table (张 for flat surfaces)
• 一杯水 (yī bēi shuǐ) — one cup of water (杯 for cups/glasses)

TIP: Learning the correct measure word for each noun is essential in Chinese. When unsure, 个 (gè) works for most people and objects.`,
  },
};

export const GRAMMAR_PRESENT_TENSE: GrammarSnapshot = {
  title: 'Present Tense Conjugation',
  content: {
    es: `SPANISH PRESENT TENSE
Regular -ar verbs (example: hablar — to speak):
• yo hablo — I speak
• tú hablas — you speak  
• él/ella habla — he/she speaks
• nosotros hablamos — we speak
• ellos hablan — they speak

Regular -er verbs (example: comer — to eat):
• yo como / tú comes / él come / nosotros comemos / ellos comen

Common irregulars:
• ser (to be): soy, eres, es, somos, son
• estar (to be): estoy, estás, está, estamos, están
• tener (to have): tengo, tienes, tiene, tenemos, tienen
• ir (to go): voy, vas, va, vamos, van

NOTE: Spanish has two verbs meaning "to be": ser (permanent traits) and estar (temporary states, locations).`,

    fr: `FRENCH PRESENT TENSE
Regular -er verbs (example: parler — to speak):
• je parle — I speak
• tu parles — you speak
• il/elle parle — he/she speaks
• nous parlons — we speak
• vous parlez — you (formal/plural) speak
• ils/elles parlent — they speak

Key irregulars:
• être (to be): je suis, tu es, il est, nous sommes, vous êtes, ils sont
• avoir (to have): j'ai, tu as, il a, nous avons, vous avez, ils ont
• aller (to go): je vais, tu vas, il va, nous allons, vous allez, ils vont

NOTE: Many final consonants are silent in French but pronunciations can change with liaisons.`,

    de: `GERMAN PRESENT TENSE
Regular verbs (example: spielen — to play):
• ich spiele — I play
• du spielst — you play
• er/sie/es spielt — he/she/it plays
• wir spielen — we play
• ihr spielt — you (plural) play
• sie/Sie spielen — they / you (formal) play

Key irregulars:
• sein (to be): ich bin, du bist, er ist, wir sind, ihr seid, sie sind
• haben (to have): ich habe, du hast, er hat, wir haben, ihr habt, sie haben
• werden (to become): ich werde, du wirst, er wird, wir werden

NOTE: German verbs take the SECOND position in a statement (V2 word order). Time phrases and other elements push the subject after the verb: "Heute lerne ich Deutsch." (Today I learn German.)`,

    zh: `CHINESE VERBS — NO CONJUGATION
Mandarin Chinese verbs do NOT change form for:
• Person (I, you, he, we)
• Number (singular/plural)
• Tense (past, present, future)

Instead, time expressions and particles mark tense:
• 我学中文。(Wǒ xué Zhōngwén.) — I study/am studying Chinese.
• 我昨天学了中文。(Wǒ zuótiān xué le Zhōngwén.) — I studied Chinese yesterday. (了 le marks completed action)
• 我明天学中文。(Wǒ míngtiān xué Zhōngwén.) — I will study Chinese tomorrow.

BASIC SENTENCE STRUCTURE: Subject + Verb + Object (same as English)
• 我爱你。(Wǒ ài nǐ.) — I love you.
• 他吃米饭。(Tā chī mǐfàn.) — He eats rice.`,
  },
};

export const GRAMMAR_NEGATION: GrammarSnapshot = {
  title: 'Negation (How to say "not")',
  content: {
    es: `SPANISH NEGATION
Simply place "no" BEFORE the verb:
• Hablo español. → No hablo español.  (I speak Spanish → I don't speak Spanish)
• Tengo hambre. → No tengo hambre.   (I'm hungry → I'm not hungry)
• Él es médico. → Él no es médico.   (He's a doctor → He's not a doctor)

Double negation is CORRECT in Spanish:
• No tengo nada. — I don't have anything. (Literally: I don't have nothing.)
• No veo a nadie. — I don't see anyone.

NOTE: Unlike English, using two negatives (no + nada/nadie/nunca) is standard grammar.`,

    fr: `FRENCH NEGATION
French negation uses TWO words wrapping the verb:
• ne ... pas (not)
• Je parle français. → Je ne parle pas français.
• Elle mange. → Elle ne mange pas.

Other negative expressions:
• ne ... jamais — never: Je ne fume jamais. (I never smoke.)
• ne ... rien — nothing: Il ne dit rien. (He says nothing.)
• ne ... plus — no longer: Je ne travaille plus. (I no longer work.)
• ne ... personne — nobody: Elle ne voit personne. (She sees nobody.)

NOTE: In spoken French, the "ne" is often dropped: "Je sais pas" (I don't know) is very common informally.`,

    de: `GERMAN NEGATION
German uses "nicht" (not) or "kein/keine" (not a/no):

NICHT negates verbs, adjectives, and adverbs:
• Ich lerne Deutsch. → Ich lerne nicht Deutsch.
• Das ist nicht richtig. — That is not correct.
• Nicht" usually goes near the END of the clause.

KEIN negates nouns that would have ein/eine or no article:
• Ich habe ein Auto. → Ich habe kein Auto. (I don't have a car.)
• Das ist eine Katze. → Das ist keine Katze. (That is not a cat.)
• kein/keine/kein (follows same pattern as ein/eine/ein)

RULE OF THUMB: Use kein with nouns; use nicht with everything else.`,

    zh: `CHINESE NEGATION
Two main negation words:

1. 不 (bù) — general negation, present/future, with choice/opinion:
• 我不去。(Wǒ bù qù.) — I'm not going.
• 他不喜欢。(Tā bù xǐhuān.) — He doesn't like it.
• 不 + adjective: 不好 (bù hǎo) — not good

2. 没 (méi) — past tense, existential negation (negates 有):
• 我没去。(Wǒ méi qù.) — I didn't go.
• 我没有钱。(Wǒ méi yǒu qián.) — I don't have money.

TONE CHANGE: 不 (bù, 4th tone) changes to 2nd tone (bú) before another 4th tone word:
• 不是 → bú shì (not is/am/are)`,
  },
};

export const GRAMMAR_QUESTIONS: GrammarSnapshot = {
  title: 'Asking Questions',
  content: {
    es: `ASKING QUESTIONS IN SPANISH
Yes/No questions: add ¿...? punctuation and use rising intonation OR invert subject/verb
• ¿Hablas español? — Do you speak Spanish?
• ¿Tienes hambre? — Are you hungry?

Question words (palabras interrogativas):
• ¿Qué? — What?
• ¿Quién? — Who?
• ¿Cuándo? — When?
• ¿Dónde? — Where?
• ¿Por qué? — Why?
• ¿Cómo? — How?
• ¿Cuánto/a? — How much?
• ¿Cuántos/as? — How many?

Always use inverted question mark ¿ at the start of questions.`,

    fr: `ASKING QUESTIONS IN FRENCH
Three ways to form yes/no questions:
1. Rising intonation (informal): Tu parles français? 
2. "Est-ce que" (standard): Est-ce que tu parles français?
3. Inversion (formal): Parles-tu français?

Question words:
• Qu'est-ce que / Que — What?
• Qui — Who?
• Quand — When?
• Où — Where?
• Pourquoi — Why?
• Comment — How?
• Combien — How much/many?
• Quel/quelle — Which?

Example: Où est la bibliothèque? — Where is the library?`,

    de: `ASKING QUESTIONS IN GERMAN
Yes/No questions: move the verb to position 1 (before subject):
• Du sprichst Deutsch. → Sprichst du Deutsch? (Do you speak German?)
• Er hat ein Auto. → Hat er ein Auto? (Does he have a car?)

W-Fragen (question words, all start with W):
• Was — What?
• Wer — Who?
• Wann — When?
• Wo — Where?
• Warum — Why?
• Wie — How?
• Wie viel — How much?
• Welche/r/s — Which?
• Woher — Where from?
• Wohin — Where to?

Example: Wo ist der Bahnhof? — Where is the train station?`,

    zh: `ASKING QUESTIONS IN CHINESE
Chinese forms questions with particles or question words — NO inversion needed.

1. 吗 (ma) — yes/no question particle (add to end of statement):
• 你是学生。→ 你是学生吗？(Nǐ shì xuéshēng ma?) — Are you a student?
• 你喜欢音乐吗？— Do you like music?

2. Question words (replace the unknown part):
• 什么 (shénme) — What?
• 谁 (shuí) — Who?
• 什么时候 (shénme shíhòu) — When?
• 哪里/哪儿 (nǎlǐ/nǎr) — Where?
• 为什么 (wèishénme) — Why?
• 怎么 (zěnme) — How?
• 多少 (duōshǎo) — How much/many?
• 哪个 (nǎ gè) — Which?

Example: 你在哪里？(Nǐ zài nǎlǐ?) — Where are you?`,
  },
};

// ─── CHAPTER DEFINITIONS ────────────────────────────────────────────────────

export interface LangChapterDef {
  number: number;
  title: string;
  description: string;
  vocabSets: VocabEntry[][];
  phrases?: PhraseEntry[];
  grammar?: GrammarSnapshot;
  xpMultiplier: number;
}

export const LANGUAGE_CHAPTERS: LangChapterDef[] = [
  {
    number: 1, title: 'Greetings & Introductions', xpMultiplier: 1.0,
    description: 'Master essential greetings, farewells, and introduce yourself confidently.',
    vocabSets: [VOCAB_GREETINGS],
    phrases: PHRASES_SURVIVAL,
  },
  {
    number: 2, title: 'Numbers, Time & Days', xpMultiplier: 1.0,
    description: 'Count to 100, name the days of the week, and talk about time.',
    vocabSets: [VOCAB_NUMBERS, VOCAB_DAYS],
  },
  {
    number: 3, title: 'Colors & Descriptions', xpMultiplier: 1.1,
    description: 'Describe the world around you with colors and common adjectives.',
    vocabSets: [VOCAB_COLORS, VOCAB_ADJECTIVES],
    grammar: GRAMMAR_ARTICLES,
  },
  {
    number: 4, title: 'Food & Dining', xpMultiplier: 1.2,
    description: 'Order food, discuss meals, and navigate restaurants like a local.',
    vocabSets: [VOCAB_FOOD],
    phrases: PHRASES_SURVIVAL,
  },
  {
    number: 5, title: 'Places & Travel', xpMultiplier: 1.2,
    description: 'Navigate cities, ask for directions, and find essential locations.',
    vocabSets: [VOCAB_PLACES, VOCAB_PRONOUNS],
    phrases: PHRASES_TRAVEL,
  },
  {
    number: 6, title: 'Verbs & Grammar Foundations', xpMultiplier: 1.5,
    description: 'Build sentences using essential verbs, negation, and questions.',
    vocabSets: [VOCAB_VERBS],
    grammar: GRAMMAR_PRESENT_TENSE,
  },
  {
    number: 7, title: 'Negation & Questions', xpMultiplier: 1.5,
    description: 'Say "no," ask questions, and hold basic conversations.',
    vocabSets: [VOCAB_VERBS, VOCAB_PRONOUNS],
    grammar: GRAMMAR_NEGATION,
  },
];

export type AllVocab = VocabEntry[];
export const ALL_VOCAB: AllVocab = [
  ...VOCAB_GREETINGS, ...VOCAB_NUMBERS, ...VOCAB_DAYS,
  ...VOCAB_COLORS, ...VOCAB_ADJECTIVES, ...VOCAB_FOOD,
  ...VOCAB_PLACES, ...VOCAB_VERBS, ...VOCAB_PRONOUNS,
];
