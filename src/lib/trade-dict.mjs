/**
 * 무역 데이터 영문 정규화 사전 — HS 코드와 국가코드.
 *
 * ── 왜 이게 제품인가 ────────────────────────────────────────────
 * 관세청 API 는 품목명을 **한글로** 준다. 국가명도 한글이다.
 * 해외 기관이 이 데이터를 쓰려면 사람이 번역해야 한다. 그게 진입장벽이고,
 * 그래서 지금까지 아무도 「HS코드 단위 한국 수출입」을 영문 API 로 팔지 않았다.
 *
 * 블룸버그가 한국 무역통계를 세계 12대 경제지표로 쓰면서도 총액만 기사화하는 이유가
 * 이것이다. **품목 단위 영문화가 곧 상품이다.**
 *
 * 그래서 여기 있는 것은 「번역」이 아니라 **국제 표준 명칭**이다.
 * HS 는 WCO 가 정한 국제 협약 체계라 2단위 류(chapter) 이름은 전 세계가 같은 것을 쓴다.
 * 한글 품목명을 기계번역하는 것보다 표준 명칭에 붙이는 쪽이 정확하고, 해외 이용자가
 * 자기 나라 통계와 바로 대조할 수 있다.
 * ──────────────────────────────────────────────────────────────
 */

/** HS 2단위 류(chapter). WCO 표준 명칭. 77 은 국제적으로 유보(reserved)라 없다. */
export const HS_CHAPTERS = {
  '01': 'Live animals',
  '02': 'Meat and edible meat offal',
  '03': 'Fish, crustaceans, molluscs and other aquatic invertebrates',
  '04': "Dairy produce; birds' eggs; natural honey",
  '05': 'Products of animal origin, not elsewhere specified',
  '06': 'Live trees and other plants; bulbs, cut flowers',
  '07': 'Edible vegetables and certain roots and tubers',
  '08': 'Edible fruit and nuts; peel of citrus fruit or melons',
  '09': 'Coffee, tea, maté and spices',
  10: 'Cereals',
  11: 'Products of the milling industry; malt; starches',
  12: 'Oil seeds and oleaginous fruits; grains, seeds and fruit',
  13: 'Lac; gums, resins and other vegetable saps and extracts',
  14: 'Vegetable plaiting materials; vegetable products not elsewhere specified',
  15: 'Animal or vegetable fats and oils',
  16: 'Preparations of meat, fish, crustaceans or molluscs',
  17: 'Sugars and sugar confectionery',
  18: 'Cocoa and cocoa preparations',
  19: 'Preparations of cereals, flour, starch or milk; pastrycooks’ products',
  20: 'Preparations of vegetables, fruit, nuts or other parts of plants',
  21: 'Miscellaneous edible preparations',
  22: 'Beverages, spirits and vinegar',
  23: 'Residues and waste from the food industries; prepared animal fodder',
  24: 'Tobacco and manufactured tobacco substitutes',
  25: 'Salt; sulphur; earths and stone; plastering materials, lime and cement',
  26: 'Ores, slag and ash',
  27: 'Mineral fuels, mineral oils and products of their distillation',
  28: 'Inorganic chemicals; compounds of precious metals and rare earths',
  29: 'Organic chemicals',
  30: 'Pharmaceutical products',
  31: 'Fertilisers',
  32: 'Tanning or dyeing extracts; pigments, paints, varnishes',
  33: 'Essential oils; perfumery, cosmetic or toilet preparations',
  34: 'Soap, organic surface-active agents, washing preparations',
  35: 'Albuminoidal substances; modified starches; glues; enzymes',
  36: 'Explosives; pyrotechnic products; matches',
  37: 'Photographic or cinematographic goods',
  38: 'Miscellaneous chemical products',
  39: 'Plastics and articles thereof',
  40: 'Rubber and articles thereof',
  41: 'Raw hides and skins (other than furskins) and leather',
  42: 'Articles of leather; saddlery; travel goods and handbags',
  43: 'Furskins and artificial fur',
  44: 'Wood and articles of wood; wood charcoal',
  45: 'Cork and articles of cork',
  46: 'Manufactures of straw, esparto or other plaiting materials',
  47: 'Pulp of wood or of other fibrous cellulosic material',
  48: 'Paper and paperboard; articles of paper pulp',
  49: 'Printed books, newspapers, pictures and other printed products',
  50: 'Silk',
  51: 'Wool, fine or coarse animal hair; horsehair yarn',
  52: 'Cotton',
  53: 'Other vegetable textile fibres; paper yarn',
  54: 'Man-made filaments',
  55: 'Man-made staple fibres',
  56: 'Wadding, felt and nonwovens; twine, cordage, ropes',
  57: 'Carpets and other textile floor coverings',
  58: 'Special woven fabrics; lace; tapestries; embroidery',
  59: 'Impregnated, coated, covered or laminated textile fabrics',
  60: 'Knitted or crocheted fabrics',
  61: 'Articles of apparel and clothing accessories, knitted or crocheted',
  62: 'Articles of apparel and clothing accessories, not knitted or crocheted',
  63: 'Other made-up textile articles; sets; worn clothing; rags',
  64: 'Footwear, gaiters and the like',
  65: 'Headgear and parts thereof',
  66: 'Umbrellas, walking sticks, whips and parts thereof',
  67: 'Prepared feathers and down; artificial flowers',
  68: 'Articles of stone, plaster, cement, asbestos or mica',
  69: 'Ceramic products',
  70: 'Glass and glassware',
  71: 'Pearls, precious stones and metals; jewellery; coin',
  72: 'Iron and steel',
  73: 'Articles of iron or steel',
  74: 'Copper and articles thereof',
  75: 'Nickel and articles thereof',
  76: 'Aluminium and articles thereof',
  78: 'Lead and articles thereof',
  79: 'Zinc and articles thereof',
  80: 'Tin and articles thereof',
  81: 'Other base metals; cermets and articles thereof',
  82: 'Tools, implements, cutlery, spoons and forks, of base metal',
  83: 'Miscellaneous articles of base metal',
  84: 'Nuclear reactors, boilers, machinery and mechanical appliances',
  85: 'Electrical machinery and equipment and parts thereof',
  86: 'Railway or tramway locomotives, rolling stock and parts',
  87: 'Vehicles other than railway or tramway rolling stock',
  88: 'Aircraft, spacecraft, and parts thereof',
  89: 'Ships, boats and floating structures',
  90: 'Optical, photographic, measuring and precision instruments',
  91: 'Clocks and watches and parts thereof',
  92: 'Musical instruments; parts and accessories',
  93: 'Arms and ammunition; parts and accessories',
  94: 'Furniture; bedding and mattresses; lamps and lighting fittings',
  95: 'Toys, games and sports requisites',
  96: 'Miscellaneous manufactured articles',
  97: "Works of art, collectors' pieces and antiques",
};

/**
 * HS 4단위 호(heading) — **한국 수출입에서 실제로 큰 것만** 넣는다.
 *
 * 전 세계 4단위는 1,200개가 넘는다. 전부 넣는 것은 나중에 해도 되지만,
 * 여기 있는 것들이 한국 무역의 대부분을 설명한다. 기사와 API 응답에서
 * 「8542」가 아니라 「Electronic integrated circuits」로 보이는 것이 핵심이다.
 */
export const HS_HEADINGS = {
  // ── 반도체·전자 (한국 수출 1위 군)
  8542: 'Electronic integrated circuits',
  8541: 'Semiconductor devices; diodes, transistors, LEDs',
  8486: 'Machines for the manufacture of semiconductor devices',
  8471: 'Automatic data processing machines (computers)',
  8473: 'Parts and accessories for office and computing machines',
  8517: 'Telephone sets and other apparatus for transmission of data',
  8528: 'Monitors, projectors and television reception apparatus',
  8523: 'Discs, tapes and solid-state storage media',
  8544: 'Insulated wire, cable and other insulated electric conductors',
  9013: 'Liquid crystal devices; lasers; optical appliances',

  // ── 배터리 (2차전지)
  8507: 'Electric accumulators (batteries), including separators',
  8506: 'Primary cells and primary batteries',
  2836: 'Carbonates, including lithium carbonate',

  // ── 자동차
  8703: 'Motor cars and other motor vehicles for transport of persons',
  8704: 'Motor vehicles for the transport of goods',
  8708: 'Parts and accessories of motor vehicles',
  8702: 'Motor vehicles for the transport of ten or more persons',

  // ── 조선
  8901: 'Cruise ships, cargo ships, barges and similar vessels',
  8905: 'Light-vessels, floating docks and drilling platforms',

  // ── 석유·에너지
  2709: 'Petroleum oils, crude',
  2710: 'Petroleum oils, other than crude',
  2711: 'Petroleum gases and other gaseous hydrocarbons',
  2701: 'Coal; briquettes and similar solid fuels made from coal',

  // ── 석유화학
  3901: 'Polymers of ethylene, in primary forms',
  3902: 'Polymers of propylene or of other olefins, in primary forms',
  3907: 'Polyacetals, polyethers and epoxide resins, in primary forms',
  2902: 'Cyclic hydrocarbons',
  2905: 'Acyclic alcohols',
  3903: 'Polymers of styrene, in primary forms',

  // ── 철강
  7208: 'Flat-rolled products of iron or non-alloy steel, hot-rolled',
  7210: 'Flat-rolled products of iron or non-alloy steel, clad or coated',
  7219: 'Flat-rolled products of stainless steel',
  7304: 'Tubes and pipes, seamless, of iron or steel',

  // ── 화장품·소비재 (K-뷰티)
  3304: 'Beauty, make-up and skin-care preparations',
  3305: 'Preparations for use on the hair',
  3307: 'Shaving and personal deodorant preparations; bath preparations',
  3401: 'Soap; organic surface-active products for washing the skin',

  // ── 식품 (K-푸드)
  1902: 'Pasta and instant noodles, whether or not prepared',
  1905: 'Bread, pastry, cakes, biscuits and other bakers’ wares',
  2005: 'Vegetables prepared or preserved otherwise than by vinegar',
  2103: 'Sauces and preparations therefor; mixed condiments',
  2106: 'Food preparations not elsewhere specified',
  // ⚠ 앞자리가 0 인 코드는 **반드시 따옴표로 감싼다.** 안 그러면 자바스크립트가
  //   8진수 리터럴로 읽어 모듈 전체가 SyntaxError 로 죽는다(실제로 당했다).
  //   HS 1~9 류(농수산물)가 전부 여기 해당한다.
  '0304': 'Fish fillets and other fish meat',
  2202: 'Waters with added sugar; other non-alcoholic beverages',
  2208: 'Undenatured ethyl alcohol; spirits and liqueurs',

  // ── 기계·기타
  8479: 'Machines and mechanical appliances having individual functions',
  8481: 'Taps, cocks, valves and similar appliances',
  9018: 'Instruments and appliances used in medical or surgical sciences',
  3004: 'Medicaments, put up in measured doses or for retail sale',
  3002: 'Human blood; vaccines, toxins and cultures',
  9503: 'Tricycles, dolls, other toys and puzzles',
  4901: 'Printed books, brochures and similar printed matter',

  /* ── 2차 확장 (2026-08-01) ─────────────────────────────────────
     1차는 52개였고 96개 류 중 21개 류에만 4단위가 있었다. 나머지 75개 류는
     조회하면 류 이름만 나오고 headingName 이 null 이었다.
     한국 수출입에서 실제로 규모가 있는 것부터 채운다. 전 세계 4단위는 1,200개가
     넘지만 전부 넣는 것이 목적이 아니다 — **한국 무역을 설명하는 것**이 목적이다. */

  // ── 비철금속 (수출입 양쪽에서 크다)
  7601: 'Unwrought aluminium',
  7604: 'Aluminium bars, rods and profiles',
  7606: 'Aluminium plates, sheets and strip',
  7403: 'Refined copper and copper alloys, unwrought',
  7407: 'Copper bars, rods and profiles',
  7408: 'Copper wire',
  7409: 'Copper plates, sheets and strip',
  7502: 'Unwrought nickel',
  7901: 'Unwrought zinc',
  7801: 'Unwrought lead',

  // ── 원자재 수입
  2601: 'Iron ores and concentrates',
  2603: 'Copper ores and concentrates',
  2606: 'Aluminium ores and concentrates',
  2523: 'Cement, including clinkers',
  2818: 'Aluminium oxide, including artificial corundum',

  // ── 고무·타이어
  4011: 'New pneumatic tyres, of rubber',
  4002: 'Synthetic rubber, in primary forms',

  // ── 기계 (84류 보강)
  8408: 'Compression-ignition internal combustion piston engines (diesel)',
  8409: 'Parts for internal combustion piston engines',
  8411: 'Turbojets, turbopropellers and other gas turbines',
  8413: 'Pumps for liquids; liquid elevators',
  8414: 'Air or vacuum pumps; compressors and fans',
  8418: 'Refrigerators, freezers and other refrigerating equipment',
  8450: 'Household or laundry-type washing machines',
  8477: 'Machinery for working rubber or plastics',
  8483: 'Transmission shafts, gears, gearing and clutches',

  // ── 전기·전자 (85류 보강)
  8501: 'Electric motors and generators',
  8504: 'Electrical transformers, static converters and inductors',
  8516: 'Electric water heaters, space heaters and electrothermic appliances',
  8518: 'Microphones, loudspeakers, headphones and audio amplifiers',
  8536: 'Electrical apparatus for switching or protecting circuits',
  8537: 'Boards, panels and consoles for electric control',
  8538: 'Parts for electrical switching and control apparatus',

  // ── 정밀·광학 (90류 보강)
  9001: 'Optical fibres and cables; sheets and plates of polarising material',
  9027: 'Instruments for physical or chemical analysis',
  9030: 'Oscilloscopes and instruments for measuring electrical quantities',
  9031: 'Measuring or checking instruments not elsewhere specified',

  // ── 화학 보강
  2814: 'Ammonia, anhydrous or in aqueous solution',
  3102: 'Mineral or chemical fertilisers, nitrogenous',
  3105: 'Mineral or chemical fertilisers containing two or three nutrients',
  3208: 'Paints and varnishes in a non-aqueous medium',
  3808: 'Insecticides, herbicides, disinfectants and similar products',
  3824: 'Prepared binders; chemical products of the chemical industries',
  2905: 'Acyclic alcohols and their derivatives',

  // ── 섬유·의류 (수입이 크다)
  5402: 'Synthetic filament yarn',
  5407: 'Woven fabrics of synthetic filament yarn',
  5503: 'Synthetic staple fibres, not carded or combed',
  6104: "Women's suits, jackets, dresses and trousers, knitted",
  6109: 'T-shirts, singlets and other vests, knitted or crocheted',
  6110: 'Jerseys, pullovers, cardigans and waistcoats, knitted',
  6203: "Men's suits, jackets, trousers and shorts, not knitted",
  6204: "Women's suits, jackets, dresses and trousers, not knitted",
  6403: 'Footwear with uppers of leather',
  6404: 'Footwear with uppers of textile materials',
  4202: 'Trunks, suitcases, handbags and similar containers',

  // ── 종이·목재
  4703: 'Chemical wood pulp, soda or sulphate',
  4810: 'Paper and paperboard, coated with kaolin or other inorganic substances',
  4811: 'Paper and paperboard, coated, impregnated or surface-decorated',
  4407: 'Wood sawn or chipped lengthwise, thicker than 6 mm',
  4412: 'Plywood, veneered panels and similar laminated wood',

  // ── 유리·요업
  7005: 'Float glass and surface-ground or polished glass, in sheets',
  7007: 'Safety glass, toughened or laminated',
  6907: 'Ceramic flags and paving, hearth or wall tiles',
  6909: 'Ceramic wares for laboratory, chemical or technical uses',

  // ── 귀금속
  7108: 'Gold, unwrought or in semi-manufactured forms',
  7113: 'Articles of jewellery and parts thereof',

  // ── 수송기기 보강
  8603: 'Self-propelled railway or tramway coaches and vans',
  8607: 'Parts of railway or tramway locomotives or rolling stock',
  8802: 'Aircraft and spacecraft, powered',
  8803: 'Parts of aircraft and spacecraft',
  8711: 'Motorcycles and cycles fitted with an auxiliary motor',

  // ── 가구·조명·잡화
  9401: 'Seats and parts thereof',
  9403: 'Other furniture and parts thereof',
  9405: 'Lamps and lighting fittings',
  8302: 'Base metal mountings, fittings and similar articles',
  8207: 'Interchangeable tools for hand tools or machine tools',

  // ── 농축수산물 (대부분 수입)
  1001: 'Wheat and meslin',
  1005: 'Maize (corn)',
  1006: 'Rice',
  1201: 'Soya beans',
  1511: 'Palm oil and its fractions',
  1701: 'Cane or beet sugar and chemically pure sucrose',
  '0201': 'Meat of bovine animals, fresh or chilled',
  '0202': 'Meat of bovine animals, frozen',
  '0203': 'Meat of swine, fresh, chilled or frozen',
  '0207': 'Meat and edible offal of poultry',
  '0303': 'Fish, frozen, excluding fish fillets',
  '0306': 'Crustaceans, whether in shell or not',
  '0803': 'Bananas, including plantains, fresh or dried',
  '0901': 'Coffee, whether or not roasted or decaffeinated',
  2304: 'Oil-cake and other solid residues from soya-bean oil',
  2402: 'Cigars, cheroots and cigarettes',

  // ── 문화·한류 관련 (WikiTip 기사와 연결되는 품목)
  9201: 'Pianos, including automatic pianos',
  9202: 'Other string musical instruments',
};

/**
 * 국가코드(ISO 3166-1 alpha-2) → 영문 국명.
 * 관세청은 2자리 코드를 쓴다. 한국의 주요 교역 상대를 우선 담았다.
 */
export const COUNTRIES = {
  CN: 'China',
  US: 'United States',
  VN: 'Vietnam',
  JP: 'Japan',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  SG: 'Singapore',
  IN: 'India',
  MX: 'Mexico',
  DE: 'Germany',
  AU: 'Australia',
  MY: 'Malaysia',
  PH: 'Philippines',
  TH: 'Thailand',
  ID: 'Indonesia',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  RU: 'Russia',
  BR: 'Brazil',
  CA: 'Canada',
  GB: 'United Kingdom',
  FR: 'France',
  IT: 'Italy',
  NL: 'Netherlands',
  ES: 'Spain',
  PL: 'Poland',
  TR: 'Türkiye',
  CZ: 'Czechia',
  HU: 'Hungary',
  SK: 'Slovakia',
  QA: 'Qatar',
  KW: 'Kuwait',
  OM: 'Oman',
  IQ: 'Iraq',
  IR: 'Iran',
  EG: 'Egypt',
  ZA: 'South Africa',
  NG: 'Nigeria',
  CL: 'Chile',
  PE: 'Peru',
  AR: 'Argentina',
  CO: 'Colombia',
  NZ: 'New Zealand',
  SE: 'Sweden',
  NO: 'Norway',
  FI: 'Finland',
  DK: 'Denmark',
  BE: 'Belgium',
  AT: 'Austria',
  CH: 'Switzerland',
  IE: 'Ireland',
  PT: 'Portugal',
  GR: 'Greece',
  RO: 'Romania',
  UA: 'Ukraine',
  KZ: 'Kazakhstan',
  UZ: 'Uzbekistan',
  BD: 'Bangladesh',
  PK: 'Pakistan',
  LK: 'Sri Lanka',
  MM: 'Myanmar',
  KH: 'Cambodia',
  LA: 'Laos',
  BN: 'Brunei',
  MN: 'Mongolia',
  NP: 'Nepal',
  IL: 'Israel',
  JO: 'Jordan',
  KR: 'South Korea',
};

/**
 * HS 코드를 사람이 읽을 수 있는 영문으로 푼다.
 *
 * 길이에 따라 단계를 나눠 돌려준다 — 4단위 사전에 없으면 2단위 류로 떨어뜨린다.
 * **없는 코드에 대해 지어내지 않는다.** heading 이 null 이면 null 로 둔다.
 * 「알 수 없음」을 그럴듯한 이름으로 채우는 순간 데이터 상품으로서 신뢰를 잃는다.
 */
export function describeHs(code) {
  if (code == null) return null;
  const s = String(code).replace(/\D/g, '');
  if (!s) return null;

  const ch = s.slice(0, 2);
  const hd = s.slice(0, 4);

  return {
    code: s,
    /** 자릿수 — 2(류) · 4(호) · 6(소호) · 10(HSK, 한국 세번) */
    level: s.length,
    chapter: ch,
    chapterName: HS_CHAPTERS[ch] ?? null,
    heading: s.length >= 4 ? hd : null,
    headingName: s.length >= 4 ? (HS_HEADINGS[hd] ?? null) : null,
    /** 화면·API 에 그대로 쓸 대표 명칭. 4단위가 있으면 그것, 없으면 류 이름. */
    label:
      (s.length >= 4 ? HS_HEADINGS[hd] : null) ?? HS_CHAPTERS[ch] ?? null,
  };
}

/** 국가코드를 영문 국명으로. 사전에 없으면 코드를 그대로 돌려준다(지어내지 않는다). */
export function describeCountry(code) {
  if (!code) return null;
  const c = String(code).trim().toUpperCase();
  return { code: c, name: COUNTRIES[c] ?? null };
}

/** 사전 규모 — API 의 /v1/meta 에서 커버리지를 밝히는 데 쓴다. */
export const DICT_STATS = {
  chapters: Object.keys(HS_CHAPTERS).length,
  headings: Object.keys(HS_HEADINGS).length,
  countries: Object.keys(COUNTRIES).length,
};
