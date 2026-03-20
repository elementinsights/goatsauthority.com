export const siteConfig = {
  // ============================================================
  //  BRAND — Change these for each blog
  // ============================================================
  name: "Goats Authority",
  nameHighlight: "Authority",        // Part that gets accent color in logo
  logo: "/images/logo.webp",
  tagline: "All You Need to Know About Goats",
  domain: "goatsauthority.com",
  url: "https://goatsauthority.com",

  // ============================================================
  //  THEME COLORS — Change accent to re-skin the entire site
  // ============================================================
  theme: {
    accent: "#191fc8",
    accentHover: "#1216a0",
    accentLight: "#eef0ff",
    accentRgb: "25, 31, 200",
  },

  // ============================================================
  //  NAVIGATION CATEGORIES
  // ============================================================
  categories: [
    { name: "Diet", slug: "what-do-goats-eat", image: "/images/category/diet.webp" },
    { name: "Health", slug: "health", image: "/images/category/health.webp" },
    { name: "Breeding", slug: "breeding", image: "/images/category/breeding.webp" },
    { name: "Food", slug: "food", image: "/images/category/food.webp" },
    { name: "Housing", slug: "housing", image: "/images/category/housing.webp" },
    { name: "Training", slug: "training", image: "/images/category/training.webp" },
    { name: "Safety", slug: "safety", image: "/images/category/safety.webp" },
  ],

  // ============================================================
  //  SOCIAL LINKS (leave empty string to hide)
  // ============================================================
  social: {
    facebook: "",
    pinterest: "",
    twitter: "",
    youtube: "",
  },

  // ============================================================
  //  FOOTER
  // ============================================================
  footerDescription: "Your trusted source for goat care, feeding guides, health tips, and breeding advice. Everything you need to raise happy, healthy goats.",
  footerPopularLinks: [
    { name: "What Do Goats Eat?", href: "/category/what-do-goats-eat", desc: "Complete guide to goat diet and nutrition." },
    { name: "Goat Health", href: "/category/health", desc: "Common health issues, treatments, and prevention." },
    { name: "Breeding Goats", href: "/category/breeding", desc: "Tips on goat breeds, mating, and raising kids." },
  ],
  amazonDisclaimer: "Goats Authority is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.",

  // ============================================================
  //  AUTHOR (default)
  // ============================================================
  author: {
    name: "Jake Holloway",
    initial: "J",
    image: "/images/author.webp",
    role: "Founder & Goat Husbandry Specialist",
    bio: "Jake has spent over a decade raising dairy and meat goats on small acreage. From bottle-feeding newborn kids to managing breeding programs and treating common health issues, he\'s handled every aspect of goat ownership firsthand. He built Goats Authority to give goat owners the practical, experience-based advice that\'s hard to find online.",
  },

  // ============================================================
  //  CONTACT
  // ============================================================
  contactEmail: "elementinsightsolutions@gmail.com",
  contactSubjectPrefix: "Goats Authority",

  // ============================================================
  //  AFFILIATE REDIRECT (Google Sheet CSV URL)
  // ============================================================
  affiliateSheetUrl: "",

  // ============================================================
  //  START HERE (homepage sidebar widget — set to empty array to hide)
  // ============================================================
  startHere: [],

  // ============================================================
  //  FEATURED IN (set to empty array to hide)
  // ============================================================
  featuredIn: [],

  // ============================================================
  //  HERO IMAGE (homepage background)
  // ============================================================
  heroImage: "/images/hero.webp",
};

export type SiteConfig = typeof siteConfig;
