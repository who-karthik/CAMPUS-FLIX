// Intelligent Matching System for Lost & Found items
// Uses multi-factor weighted scoring:
// 1. Item Name Similarity (35%)
// 2. Category Similarity (20%)
// 3. Description Similarity (20%)
// 4. Location Similarity (15%)
// 5. Date Proximity (10%)

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "my", "your", "his", "her", "its", "their", "this", "that",
  "near", "found", "lost", "item", "color", "left", "inside"
]);

// Helper to tokenize and clean text
export function tokenize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// Jaccard similarity of two token lists
export function jaccardSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// String similarity with substring and token overlap
export function stringSimilarity(strA = "", strB = "") {
  const sA = String(strA).trim().toLowerCase();
  const sB = String(strB).trim().toLowerCase();
  if (!sA || !sB) return 0;
  if (sA === sB) return 100;

  // Substring checks
  if (sA.includes(sB) || sB.includes(sA)) {
    const ratio = Math.min(sA.length, sB.length) / Math.max(sA.length, sB.length);
    return Math.max(80, Math.round(ratio * 100));
  }

  const tokensA = tokenize(sA);
  const tokensB = tokenize(sB);
  const jaccard = jaccardSimilarity(tokensA, tokensB);

  // Check character bigram dice coefficient for typo tolerance
  const bigramsA = getBigrams(sA);
  const bigramsB = getBigrams(sB);
  const dice = diceCoefficient(bigramsA, bigramsB);

  const combined = Math.max(jaccard * 100, dice * 100);
  return Math.round(combined);
}

function getBigrams(str) {
  const bigrams = new Set();
  const clean = str.replace(/\s+/g, "");
  for (let i = 0; i < clean.length - 1; i++) {
    bigrams.add(clean.substring(i, i + 2));
  }
  return bigrams;
}

function diceCoefficient(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let matches = 0;
  for (const b of setA) {
    if (setB.has(b)) matches++;
  }
  return (2 * matches) / (setA.size + setB.size);
}

// Category similarity
export function categorySimilarity(catA = "", catB = "") {
  const cA = String(catA).trim().toLowerCase();
  const cB = String(catB).trim().toLowerCase();
  if (!cA || !cB) return 0;
  if (cA === cB) return 100;

  // Related category mapping
  const relatedGroups = [
    ["bags", "accessories"],
    ["electronics", "other"],
    ["books", "documents"],
  ];

  for (const group of relatedGroups) {
    if (group.includes(cA) && group.includes(cB)) {
      return 50;
    }
  }

  return 0;
}

// Location similarity
export function locationSimilarity(locA = "", locB = "") {
  const lA = String(locA).trim().toLowerCase();
  const lB = String(locB).trim().toLowerCase();
  if (!lA || !lB) return 0;
  if (lA === lB) return 100;

  const tokensA = tokenize(lA);
  const tokensB = tokenize(lB);
  const jaccard = jaccardSimilarity(tokensA, tokensB);

  // Common campus landmarks
  const landmarks = [
    "library", "cafeteria", "audi", "auditorium", "lab", "hostel",
    "sports", "ground", "canteen", "gymnasium", "gym", "block", "classroom"
  ];
  let sharedLandmark = false;
  for (const mark of landmarks) {
    if (lA.includes(mark) && lB.includes(mark)) {
      sharedLandmark = true;
      break;
    }
  }

  const score = Math.max(jaccard * 100, sharedLandmark ? 75 : 0);
  return Math.round(score);
}

// Date proximity (0 to 100 score)
export function dateProximityScore(dateA, dateB) {
  const dA = new Date(dateA);
  const dB = new Date(dateB);
  if (isNaN(dA.getTime()) || isNaN(dB.getTime())) return 50;

  const diffMs = Math.abs(dA.getTime() - dB.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 2) return 100;
  if (diffDays <= 5) return 80;
  if (diffDays <= 10) return 60;
  if (diffDays <= 20) return 35;
  return 10;
}

/**
 * Calculate multi-factor match score between Lost report and Found report
 * @param {Object} lostItem
 * @param {Object} foundItem
 * @returns {Object} { confidenceScore, matchingFactors, tier }
 */
export function calculateMatch(lostItem, foundItem, isLiveTyping = false) {
  const nameScore = stringSimilarity(lostItem.itemName, foundItem.itemName);
  const catScore = categorySimilarity(lostItem.category, foundItem.category);

  // Description similarity using tokens
  const descTokensLost = tokenize(lostItem.description);
  const descTokensFound = tokenize(foundItem.description);
  const descScore = (descTokensLost.length && descTokensFound.length)
    ? Math.round(jaccardSimilarity(descTokensLost, descTokensFound) * 100)
    : (nameScore > 65 ? Math.round(nameScore * 0.75) : 0);

  const locScore = (lostItem.location && foundItem.location)
    ? locationSimilarity(lostItem.location, foundItem.location)
    : (nameScore > 65 ? 50 : 0);

  const dateScore = dateProximityScore(lostItem.date, foundItem.date);

  let confidenceScore = 0;
  if (isLiveTyping) {
    // During live typing in report modal, name and category are primary
    confidenceScore = Math.round(nameScore * 0.55 + catScore * 0.30 + dateScore * 0.15);
  } else {
    // Full report comparison weights:
    // Name 35%, Category 20%, Description 20%, Location 15%, Date 10%
    const weighted =
      nameScore * 0.35 +
      catScore * 0.20 +
      descScore * 0.20 +
      locScore * 0.15 +
      dateScore * 0.10;
    confidenceScore = Math.min(100, Math.max(0, Math.round(weighted)));
  }

  let tier = "none";
  if (confidenceScore >= 80) tier = "strong"; // 80-100: Strong potential match
  else if (confidenceScore >= 60) tier = "possible"; // 60-79: Possible match

  return {
    confidenceScore,
    matchingFactors: {
      nameScore,
      categoryScore: catScore,
      descriptionScore: descScore,
      locationScore: locScore,
      dateScore
    },
    tier
  };
}

/**
 * Find matching counterpart items from an array or database query
 * If targetItem is Lost, search Found items. If Found, search Lost items.
 */
export function findMatches(targetItem, candidateList = [], isLiveTyping = false) {
  if (!targetItem || !Array.isArray(candidateList)) return [];

  const oppositeType = targetItem.type === "Lost" ? "Found" : "Lost";

  return candidateList
    .filter((candidate) => {
      // Must be opposite type, not same item, and not returned
      const sameId = String(candidate._id) === String(targetItem._id);
      const isOpposite = candidate.type === oppositeType;
      const isNotReturned = candidate.status !== "Returned";
      return !sameId && isOpposite && isNotReturned;
    })
    .map((candidate) => {
      const lost = targetItem.type === "Lost" ? targetItem : candidate;
      const found = targetItem.type === "Found" ? targetItem : candidate;
      const { confidenceScore, matchingFactors, tier } = calculateMatch(lost, found, isLiveTyping);
      return {
        item: candidate,
        confidenceScore,
        matchingFactors,
        tier
      };
    })
    .filter((match) => match.confidenceScore >= (isLiveTyping ? 50 : 60))
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
}
