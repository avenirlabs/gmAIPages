// api/_services/chips.ts
// Smart refineChips generation from query and search results

// Comprehensive keyword maps for relations (Indian + US terms)
const RELATION_WORDS: Record<string, string[]> = {
  'Dad Gifts': ['dad', 'daddy', 'father', 'papa', 'pita', 'pitaji', 'baba'],
  'Mom Gifts': ['mom', 'mommy', 'mother', 'mama', 'maa', 'mata', 'mataji', 'amma'],
  'Brother Gifts': ['brother', 'bro', 'bhai', 'bhaiya', 'anna', 'dada'],
  'Sister Gifts': ['sister', 'sis', 'behen', 'didi', 'akka', 'tai'],
  'Husband Gifts': ['husband', 'hubby', 'pati', 'patni', 'spouse'],
  'Wife Gifts': ['wife', 'wifey', 'patni', 'spouse', 'better half'],
  'Girlfriend Gifts': ['girlfriend', 'gf', 'partner', 'lover'],
  'Boyfriend Gifts': ['boyfriend', 'bf', 'partner', 'lover'],
  'Teacher Gifts': ['teacher', 'guru', 'guriji', 'professor', 'sir', 'madam'],
  'Boss Gifts': ['boss', 'manager', 'supervisor', 'sahab', 'sahib'],
  'Friend Gifts': ['friend', 'buddy', 'pal', 'dost', 'yaar', 'mate'],
  'Colleague Gifts': ['colleague', 'coworker', 'teammate', 'office'],
  'Grandparents Gifts': ['grandpa', 'grandma', 'grandfather', 'grandmother', 'nana', 'nani', 'dada', 'dadi', 'thatha', 'ajji'],
  'Kids Gifts': ['kid', 'kids', 'child', 'children', 'beta', 'beti', 'bachcha', 'baby'],
  'Teen Gifts': ['teen', 'teenager', 'adolescent', 'young']
};

// Comprehensive keyword maps for occasions (Indian + US)
const OCCASION_WORDS: Record<string, string[]> = {
  'Birthday Gifts': ['birthday', 'bday', 'janmadin', 'piranaal'],
  'Anniversary Gifts': ['anniversary', 'wedding anniversary', 'marriage', 'shaadi'],
  'Valentine Gifts': ['valentine', 'valentines', 'love', 'romantic'],
  'Christmas Gifts': ['christmas', 'xmas', 'holiday', 'festive'],
  'Diwali Gifts': ['diwali', 'deepavali', 'festival of lights'],
  'Rakhi Gifts': ['rakhi', 'rakshabandhan', 'raksha bandhan'],
  'Holi Gifts': ['holi', 'festival of colors', 'rang'],
  'Eid Gifts': ['eid', 'eid mubarak', 'ramadan'],
  'Karva Chauth Gifts': ['karva chauth', 'karwa chauth'],
  'Mothers Day Gifts': ['mothers day', 'mother\'s day', 'matru divas'],
  'Fathers Day Gifts': ['fathers day', 'father\'s day', 'pitru divas'],
  'Wedding Gifts': ['wedding', 'marriage', 'shaadi', 'vivah'],
  'Graduation Gifts': ['graduation', 'convocation', 'degree'],
  'New Year Gifts': ['new year', 'naya saal', 'nav varsh'],
  'Farewell Gifts': ['farewell', 'goodbye', 'leaving', 'vidaai'],
  'Congratulations Gifts': ['congratulations', 'congrats', 'success', 'achievement'],
  'Get Well Gifts': ['get well', 'recovery', 'feel better', 'health']
};

// Comprehensive keyword maps for interests/hobbies (Indian + US)
const INTEREST_WORDS: Record<string, string[]> = {
  'Foodie Gifts': ['foodie', 'cooking', 'chef', 'food lover', 'culinary', 'khana'],
  'Gamer Gifts': ['gamer', 'gaming', 'video games', 'console', 'pc gaming'],
  'Traveler Gifts': ['traveler', 'travel', 'wanderlust', 'explorer', 'backpacker'],
  'Cricket Gifts': ['cricket', 'cricketer', 'batting', 'bowling', 'ipl'],
  'Football Gifts': ['football', 'soccer', 'fifa', 'sports'],
  'Yoga Gifts': ['yoga', 'meditation', 'mindfulness', 'zen', 'spiritual'],
  'Coffee Gifts': ['coffee', 'caffeine', 'espresso', 'latte', 'chai'],
  'Tea Gifts': ['tea', 'chai', 'green tea', 'herbal tea'],
  'Book Gifts': ['books', 'reading', 'bookworm', 'literature', 'novel'],
  'Music Gifts': ['music', 'musician', 'singer', 'instrument', 'melody'],
  'Art Gifts': ['art', 'artist', 'painting', 'drawing', 'creative'],
  'Photography Gifts': ['photography', 'photographer', 'camera', 'photo'],
  'Pet Gifts': ['pet', 'dog', 'cat', 'animal lover', 'puppy', 'kitten'],
  'Plant Gifts': ['plant', 'gardening', 'green thumb', 'nature', 'botanical'],
  'Skincare Gifts': ['skincare', 'beauty', 'cosmetics', 'makeup', 'spa'],
  'Tech Gifts': ['tech', 'technology', 'gadget', 'electronic', 'smart'],
  'Fitness Gifts': ['fitness', 'gym', 'workout', 'exercise', 'health'],
  'Fashion Gifts': ['fashion', 'style', 'clothing', 'trendy', 'stylish'],
  'Handmade Gifts': ['handmade', 'craft', 'diy', 'artisan', 'handcrafted'],
  'Luxury Gifts': ['luxury', 'premium', 'expensive', 'high end', 'elite'],
  'Eco Friendly Gifts': ['eco', 'sustainable', 'green', 'environment', 'organic'],
  'Vintage Gifts': ['vintage', 'retro', 'classic', 'antique', 'old school']
};

// Combine all keyword maps
const ALL_KEYWORDS = {
  ...RELATION_WORDS,
  ...OCCASION_WORDS,
  ...INTEREST_WORDS
};

/**
 * Extract chips from search query by matching keywords
 */
export function extractChipsFromQuery(query: string): string[] {
  if (!query || typeof query !== 'string') return [];

  const lowerQuery = query.toLowerCase();
  const matchedChips = new Set<string>();

  for (const [chipName, keywords] of Object.entries(ALL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        matchedChips.add(chipName);
        break; // Found match for this chip, move to next
      }
    }
  }

  return Array.from(matchedChips);
}

/**
 * Extract chips from search results by scanning titles and descriptions
 */
export function extractChipsFromHits(hits: any[]): string[] {
  if (!Array.isArray(hits) || hits.length === 0) return [];

  const matchedChips = new Set<string>();

  for (const hit of hits) {
    // Combine searchable text from hit
    const searchableText = [
      hit.title,
      hit.name,
      hit.product_title,
      hit.heading,
      hit.description,
      hit.category,
      hit.tags,
      ...(Array.isArray(hit.categories) ? hit.categories : []),
      ...(Array.isArray(hit.tags) ? hit.tags : [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!searchableText) continue;

    // Match keywords in hit content
    for (const [chipName, keywords] of Object.entries(ALL_KEYWORDS)) {
      for (const keyword of keywords) {
        if (searchableText.includes(keyword.toLowerCase())) {
          matchedChips.add(chipName);
          break; // Found match for this chip, move to next
        }
      }
    }
  }

  return Array.from(matchedChips);
}

/**
 * Build refined chips from query and hits with frequency scoring
 */
export function buildRefineChips(query: string, hits: any[]): string[] {
  try {
    const queryChips = extractChipsFromQuery(query);
    const hitChips = extractChipsFromHits(hits);

    // Create frequency map (query matches get higher weight)
    const chipFrequency: Record<string, number> = {};

    // Query chips get weight of 2 (higher priority)
    for (const chip of queryChips) {
      chipFrequency[chip] = (chipFrequency[chip] || 0) + 2;
    }

    // Hit chips get weight of 1
    for (const chip of hitChips) {
      chipFrequency[chip] = (chipFrequency[chip] || 0) + 1;
    }

    // Sort by frequency (desc), then alphabetically
    const sortedChips = Object.entries(chipFrequency)
      .sort(([nameA, freqA], [nameB, freqB]) => {
        if (freqA !== freqB) return freqB - freqA; // Frequency desc
        return nameA.localeCompare(nameB); // Alphabetical
      })
      .map(([name]) => name);

    // Cap at 6 chips for UI friendliness
    return sortedChips.slice(0, 6);

  } catch (error) {
    console.warn('[chips] Error building refine chips:', error);
    return []; // Never throw, return empty array
  }
}