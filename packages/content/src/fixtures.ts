import type { Article, Author, Category } from './types'

/** DEV_ONLY — never ship when LAUNCH_STATUS=live or ALLOW_DEV_FIXTURES=false */
export const DEV_FIXTURE_MARK = 'DEV_ONLY' as const

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()

export const fixtureCategories: Category[] = [
  { id: 'cat-samachar', slug: 'samachar', nameNe: 'समाचार', nameEn: 'News' },
  { id: 'cat-rajniti', slug: 'rajniti', nameNe: 'राजनीति', nameEn: 'Politics' },
  { id: 'cat-arth', slug: 'arth', nameNe: 'अर्थ', nameEn: 'Economy' },
  { id: 'cat-pradesh', slug: 'pradesh', nameNe: 'प्रदेश', nameEn: 'Provinces' },
  { id: 'cat-bichar', slug: 'bichar', nameNe: 'विचार', nameEn: 'Opinion' },
  { id: 'cat-khel', slug: 'khel', nameNe: 'खेल', nameEn: 'Sports' },
  { id: 'cat-bishwa', slug: 'bishwa', nameNe: 'विश्व', nameEn: 'World' },
  { id: 'cat-pravas', slug: 'pravas', nameNe: 'प्रवास', nameEn: 'Diaspora' },
]

export const fixtureAuthors: Author[] = [
  {
    id: 'auth-1',
    slug: 'anusha-rai',
    nameNe: 'अनुशा राई',
    nameEn: 'Anusha Rai',
    bioNe: 'काठमाडौंबाट राजनीतिक रिपोर्टिङ।',
    bioEn: 'Politics desk, Kathmandu.',
  },
  {
    id: 'auth-2',
    slug: 'bibek-shrestha',
    nameNe: 'विवेक श्रेष्ठ',
    nameEn: 'Bibek Shrestha',
    bioNe: 'अर्थ र प्रदेश कभरेज।',
    bioEn: 'Economy and provinces.',
  },
]

export const fixtureArticles: Article[] = [
  {
    id: 'art-1',
    slug: 'federal-budget-debate-opens',
    status: 'published',
    englishStatus: 'published',
    titleNe: 'संघीय बजेट बहस संसदमा सुरु',
    titleEn: 'Federal budget debate opens in parliament',
    deckNe: 'विपक्षी दलहरूले प्राथमिकतामाथि प्रश्न उठाए भने सत्तापक्षले विकास खर्चको रक्षा गरे।',
    deckEn: 'Opposition questions priorities while the government defends development spending.',
    bodyNe: [
      {
        type: 'paragraph',
        text: 'काठमाडौं - संघीय संसदमा बजेटमाथि औपचारिक बहस सुरु भएको छ। सांसदहरूले स्वास्थ्य, शिक्षा र प्रादेशिक समानीकरण कोषमाथिको ध्यान केन्द्रित गरेका छन्।',
      },
      {
        type: 'heading2',
        text: 'प्रादेशिक आवाज',
      },
      {
        type: 'paragraph',
        text: 'सातै प्रदेशका प्रतिनिधिहरूले राजधानी केन्द्रित खर्चको आलोचना गरेका छन्। सरकारले भने ग्रामीण सडक र सिँचाइ योजनाहरू अघि बढाइने जनाएको छ।',
      },
      {
        type: 'pullQuote',
        text: 'बजेट कागजमा होइन, गाउँमा देखिनुपर्छ।',
        attribution: 'एक प्रदेश सांसद',
      },
      {
        type: 'paragraph',
        text: 'बहस यस साताभर चल्ने अपेक्षा छ। समिति चरणमा दफावार छलफल हुनेछ।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Kathmandu - Formal debate on the federal budget has opened in parliament. Lawmakers focused on health, education, and the provincial equalization fund.',
      },
      {
        type: 'heading2',
        text: 'Provincial voices',
      },
      {
        type: 'paragraph',
        text: 'Representatives from all seven provinces criticized capital-heavy spending. The government said rural roads and irrigation will move forward.',
      },
      {
        type: 'pullQuote',
        text: 'A budget must be visible in the village, not only on paper.',
        attribution: 'A provincial MP',
      },
      {
        type: 'paragraph',
        text: 'Debate is expected to run through the week before clause-by-clause committee review.',
      },
    ],
    categoryId: 'cat-rajniti',
    authorIds: ['auth-1'],
    tagSlugs: ['budget', 'parliament'],
    province: undefined,
    hero: {
      id: 'media-1',
      url: 'https://picsum.photos/seed/nagarik-budget/1600/900',
      alt: 'Parliament chamber during budget session',
      credit: 'DEV_ONLY fixture',
      width: 1600,
      height: 900,
    },
    isBreaking: true,
    editorialPriority: 9,
    attribution: 'original',
    corrections: [],
    publishedAt: hoursAgo(2),
    updatedAt: hoursAgo(1),
    packageId: 'pkg-budget',
  },
  {
    id: 'art-2',
    slug: 'monsoon-preparedness-bagmati',
    status: 'published',
    englishStatus: 'draft',
    titleNe: 'बागमतीमा मनसुन पूर्वतयारी तीव्र',
    deckNe: 'जिल्ला प्रशासनले जोखिमयुक्त बस्तीमा स्थानान्तरण तयारी गरेको छ।',
    bodyNe: [
      {
        type: 'paragraph',
        text: 'हेटौंडा - बागमती प्रदेश प्रशासनले मनसुनअघि जोखिम नक्सा अद्यावधिक गरेको छ। खोला किनाराका बस्तीमा विशेष निगरानी रहनेछ।',
      },
      {
        type: 'paragraph',
        text: 'स्थानीय तहहरूलाई राहत सामग्रीको मौज्दात जाँच गर्न निर्देशन दिइएको छ।',
      },
    ],
    categoryId: 'cat-pradesh',
    authorIds: ['auth-2'],
    tagSlugs: ['monsoon', 'bagmati'],
    province: 'bagmati',
    hero: {
      id: 'media-2',
      url: 'https://picsum.photos/seed/nagarik-monsoon/1600/900',
      alt: 'Riverbank settlement under monsoon cloud cover',
      credit: 'DEV_ONLY fixture',
      width: 1600,
      height: 900,
    },
    isBreaking: false,
    editorialPriority: 6,
    attribution: 'original',
    corrections: [],
    publishedAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'art-3',
    slug: 'remittance-costs-gulf-corridor',
    status: 'published',
    englishStatus: 'published',
    titleNe: 'खाडी करिडरमा रेमिट्यान्स खर्च घटाउने बहस',
    titleEn: 'Debate grows over remittance costs on the Gulf corridor',
    deckNe: 'प्रवासी कामदारहरूले सेवा शुल्क र विनिमय अन्तरलाई मुख्य समस्या बताएका छन्।',
    deckEn: 'Migrant workers flag fees and exchange spreads as the core problem.',
    bodyNe: [
      {
        type: 'paragraph',
        text: 'काठमाडौं - प्रवास डेस्कले खाडीबाट नेपाल आउने रकमको औसत लागत तुलना गरेको छ। केही कोरिडरमा शुल्क अझै उच्च छ।',
      },
      {
        type: 'paragraph',
        text: 'नियामकहरूले डिजिटल वालेट र बैंक साझेदारी विस्तारको कुरा गरेका छन्।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Kathmandu - The diaspora desk compared average remittance costs from the Gulf. Fees remain high on some corridors.',
      },
      {
        type: 'paragraph',
        text: 'Regulators pointed to digital wallets and bank partnerships as next steps.',
      },
    ],
    categoryId: 'cat-pravas',
    authorIds: ['auth-2', 'auth-1'],
    tagSlugs: ['remittance', 'gulf'],
    hero: {
      id: 'media-3',
      url: 'https://picsum.photos/seed/nagarik-remit/1600/900',
      alt: 'Queue at a remittance counter',
      credit: 'DEV_ONLY fixture',
      width: 1600,
      height: 900,
    },
    isBreaking: false,
    editorialPriority: 5,
    attribution: 'original',
    corrections: [],
    publishedAt: hoursAgo(12),
    updatedAt: hoursAgo(10),
  },
  {
    id: 'art-4',
    slug: 'opinion-local-elections-turnout',
    status: 'published',
    englishStatus: 'none',
    titleNe: 'मतदान सहभागिता किन घट्दै छ?',
    deckNe: 'स्थानीय चुनावको पाठ: पहुँच मात्र पर्याप्त छैन, विश्वास चाहिन्छ।',
    bodyNe: [
      {
        type: 'paragraph',
        text: 'मतदाता थकान र युवा स्थानान्तरणले सहभागितामा असर पारेको देखिन्छ। दलहरूले ढोका-ढोका अभियानलाई डिजिटल आवाजसँग जोड्नुपर्छ।',
      },
      {
        type: 'paragraph',
        text: 'तर सहभागिता बढाउने उपाय नारा होइन, सेवाको अनुभव हो।',
      },
    ],
    categoryId: 'cat-bichar',
    authorIds: ['auth-1'],
    tagSlugs: ['elections', 'opinion'],
    isBreaking: false,
    editorialPriority: 4,
    attribution: 'original',
    corrections: [],
    publishedAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
  },
  {
    id: 'art-5',
    slug: 'national-team-qualifier-win',
    status: 'published',
    englishStatus: 'published',
    titleNe: 'क्वालिफायरमा नेपाली टिमको जित',
    titleEn: 'Nepal wins qualifier match',
    deckNe: 'घरेलु मैदानमा दबाबपूर्ण खेलपछि विजय।',
    deckEn: 'A hard-fought win on home ground.',
    bodyNe: [
      { type: 'paragraph', text: 'काठमाडौं - राष्ट्रिय टिमले क्वालिफायरमा महत्वपूर्ण जित हात पारेको छ।' },
      { type: 'paragraph', text: 'अर्को चरणको तालिका शुक्रबार सार्वजनिक हुनेछ।' },
    ],
    bodyEn: [
      { type: 'paragraph', text: 'Kathmandu - The national team secured a key qualifier win.' },
      { type: 'paragraph', text: 'The next-round schedule will be published on Friday.' },
    ],
    categoryId: 'cat-khel',
    authorIds: ['auth-2'],
    tagSlugs: ['football'],
    hero: {
      id: 'media-5',
      url: 'https://picsum.photos/seed/nagarik-sport/1600/900',
      alt: 'Football players celebrating on the pitch',
      credit: 'DEV_ONLY fixture',
      width: 1600,
      height: 900,
    },
    isBreaking: false,
    editorialPriority: 3,
    attribution: 'original',
    corrections: [],
    publishedAt: hoursAgo(8),
    updatedAt: hoursAgo(8),
  },
]
