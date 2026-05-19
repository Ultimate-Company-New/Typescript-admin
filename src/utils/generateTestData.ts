import { leadApi } from "../api/leadApi";
import { pickupLocationApi } from "../api/pickupLocationApi";
import {
  productCategoryApi,
  type ProductCategoryWithPath,
} from "../api/productCategoryApi";
import type { UserGroupRequestModel } from "../api/userGroupApi";
import {
  COUNTRIES,
  PRODUCT_COLOR_OPTIONS,
  PRODUCT_CONDITION_OPTIONS,
  USER_ROLES,
} from "../constants/appConstants";
import type {
  LeadRequestModel,
  ProductRequestModel,
  PromoRequestModel,
  UserRequestModel,
} from "../models/api-models";
import type {
  PackagePickupLocationMappingRequestModel,
  PackageRequestModel,
} from "../models/api-models/PackageModels";

// ============================================================================
// User Test Data Generation
// ============================================================================

/**
 * Generate test user data
 * Creates an array of test user objects with realistic test data
 *
 * @param numberOfRecords - Number of test user records to generate
 * @returns Array of UserRequestModel objects (includes imageUrl for import flows)
 */
export const generateUserTest = (
  numberOfRecords: number
): Array<UserRequestModel & { imageUrl?: string }> => {
  const users: Array<UserRequestModel & { imageUrl?: string }> = [];

  for (let i = 1; i <= numberOfRecords; i++) {
    const timestamp = Date.now() + i;
    const randomAddressType = Math.random() < 0.5 ? "HOME" : "WORK";
    // Generate random profile picture URL using Picsum Photos (200x200 size)
    const randomImageId = 1 + Math.floor(Math.random() * 100); // Random ID between 1-100
    const imageUrl = `https://picsum.photos/200/200?random=${
      randomImageId + i
    }`;

    const user: UserRequestModel & { imageUrl?: string } = {
      loginName: `nahushrai+ui_testuser${timestamp}@gmail.com`,
      firstName: "UI Test",
      lastName: `User ${i}`,
      phone: "9876543210",
      role: USER_ROLES.SUPER_ADMIN,
      dob: "1990-01-15",
      imageUrl,
      address: {
        streetAddress: "123 Test Street",
        streetAddress2: "Suite 100",
        streetAddress3: "Building A, Floor 5",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        zipCode: "400001",
        country: "India",
        addressType: randomAddressType,
        nameOnAddress: "Test User",
        emailOnAddress: `test${timestamp}@example.com`,
        phoneOnAddress: "9123456789",
      },
      notes: "This is a test user created for automated testing purposes.",
    };

    users.push(user);
  }

  return users;
};

// ============================================================================
// User Group Test Data Generation
// ============================================================================

/**
 * User group template for test data generation (internal use)
 */
interface UserGroupTemplate {
  prefix: string;
  description: string;
  notes: string;
}

/**
 * Pre-defined user group templates for variety in test data
 */
const USER_GROUP_TEMPLATES: UserGroupTemplate[] = [
  {
    prefix: "Developers",
    description:
      "Development team with full access to code repositories and deployment tools",
    notes: "Handles core development and feature implementation",
  },
  {
    prefix: "QA Team",
    description:
      "Quality Assurance team responsible for testing and bug reporting",
    notes: "Ensures quality through comprehensive testing",
  },
  {
    prefix: "DevOps",
    description: "Infrastructure and deployment management team",
    notes: "Manages CI/CD pipelines and cloud infrastructure",
  },
  {
    prefix: "Frontend Team",
    description: "UI/UX development and design team",
    notes: "Builds user interfaces and experiences",
  },
  {
    prefix: "Backend Team",
    description: "Server-side development and API team",
    notes: "Develops APIs and server logic",
  },
  {
    prefix: "Mobile Team",
    description: "iOS and Android application development",
    notes: "Creates native mobile applications",
  },
  {
    prefix: "Data Science",
    description: "Analytics and machine learning team",
    notes: "Builds ML models and analyzes data",
  },
  {
    prefix: "Security Team",
    description: "Cybersecurity and compliance team",
    notes: "Ensures system security and compliance",
  },
  {
    prefix: "Support Team",
    description: "Customer support and issue resolution",
    notes: "Provides customer assistance and resolves issues",
  },
  {
    prefix: "Product Team",
    description: "Product management and strategy",
    notes: "Defines product roadmap and features",
  },
];

/**
 * Get a random subset of user IDs from the available pool
 * @param allUserIds - Array of all available user IDs
 * @param min - Minimum number of user IDs to select (default: 3)
 * @param max - Maximum number of user IDs to select (default: 8)
 * @returns Array of randomly selected user IDs
 */
export const getRandomUserIdsArray = (
  allUserIds: number[],
  min = 3,
  max = 8
): number[] => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const actualCount = Math.min(count, allUserIds.length);
  const shuffled = [...allUserIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, actualCount);
};

/**
 * Generate test data for user group bulk import
 * Creates an array of UserGroupRequestModel objects with varied test data
 *
 * @param numberOfRecords - Number of test user group records to generate
 * @param allUserIds - Array of available user IDs to assign to groups
 * @param minUsersPerGroup - Minimum users per group (default: 20)
 * @param maxUsersPerGroup - Maximum users per group (default: 30)
 * @returns Array of UserGroupRequestModel objects for import API
 */
export const generateUserGroupImportTest = (
  numberOfRecords: number,
  allUserIds: number[],
  minUsersPerGroup = 20,
  maxUsersPerGroup = 30
): UserGroupRequestModel[] => {
  const userGroups: UserGroupRequestModel[] = [];
  const baseTimestamp = Date.now();

  for (let i = 0; i < numberOfRecords; i++) {
    const template = USER_GROUP_TEMPLATES[i % USER_GROUP_TEMPLATES.length];
    const groupUserIds = getRandomUserIdsArray(
      allUserIds,
      minUsersPerGroup,
      maxUsersPerGroup
    );

    userGroups.push({
      groupName: `Test Group - ${template.prefix} ${baseTimestamp + i}`,
      description: template.description,
      notes: template.notes,
      userIds: groupUserIds,
    });
  }

  return userGroups;
};

/**
 * Generate test data for a single user group form
 * Returns a random group template with a unique name
 *
 * @param preserveName - Optional existing name to preserve (for edit mode)
 * @returns Partial UserGroupRequestModel for form population (without userIds)
 */
export const generateUserGroupFormTest = (
  preserveName?: string
): Pick<UserGroupRequestModel, "groupName" | "description" | "notes"> => {
  const template =
    USER_GROUP_TEMPLATES[
      Math.floor(Math.random() * USER_GROUP_TEMPLATES.length)
    ];

  return {
    groupName: preserveName ?? `Test Group - ${template.prefix} ${Date.now()}`,
    description: template.description,
    notes: template.notes,
  };
};

// ============================================================================
// Lead Test Data Generation
// ============================================================================

/**
 * Lead status options matching database constraints
 */
const LEAD_STATUSES = [
  "Not Contacted",
  "Attempted To Contact",
  "Contacted",
  "Contact In Future",
  "Re Qualified",
  "Not Qualified",
  "Lost Lead",
  "Junk Lead",
];

/**
 * Generate a random fax number (10 digits, same format as phone)
 * @returns 10-digit fax number string starting with 9 or 8
 */
const generateFaxNumber = (): string => {
  const prefix = Math.random() > 0.5 ? "98" : "88";
  const remaining = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${remaining}`;
};

/**
 * Generate a random phone number (10 digits)
 * @returns 10-digit phone number string starting with 98
 */
const generatePhoneNumber = (): string => {
  return `98${Math.floor(10000000 + Math.random() * 90000000)}`;
};

/**
 * Lead template for test data generation
 */
interface LeadTemplate {
  firstNamePrefix: string;
  lastNamePrefix: string;
  company: string;
  title: string;
  annualRevenue: string;
  companySize: number;
  notes: string;
}

/**
 * Pre-defined lead templates for variety in test data
 */
const LEAD_TEMPLATES: LeadTemplate[] = [
  {
    firstNamePrefix: "Tech",
    lastNamePrefix: "Innovator",
    company: "TechCorp Solutions",
    title: "CTO",
    annualRevenue: "50000000",
    companySize: 250,
    notes: "Interested in enterprise software solutions",
  },
  {
    firstNamePrefix: "Sales",
    lastNamePrefix: "Manager",
    company: "Global Retail Inc",
    title: "VP of Sales",
    annualRevenue: "100000000",
    companySize: 500,
    notes: "Looking for CRM integration",
  },
  {
    firstNamePrefix: "Marketing",
    lastNamePrefix: "Director",
    company: "Creative Agency Ltd",
    title: "Marketing Director",
    annualRevenue: "10000000",
    companySize: 50,
    notes: "Needs marketing automation tools",
  },
  {
    firstNamePrefix: "Finance",
    lastNamePrefix: "Analyst",
    company: "Capital Finance Group",
    title: "CFO",
    annualRevenue: "200000000",
    companySize: 1000,
    notes: "Evaluating financial management software",
  },
  {
    firstNamePrefix: "Operations",
    lastNamePrefix: "Lead",
    company: "Logistics Pro Services",
    title: "Operations Manager",
    annualRevenue: "75000000",
    companySize: 300,
    notes: "Interested in supply chain optimization",
  },
  {
    firstNamePrefix: "HR",
    lastNamePrefix: "Executive",
    company: "People First Consulting",
    title: "HR Director",
    annualRevenue: "25000000",
    companySize: 100,
    notes: "Looking for HR management solutions",
  },
  {
    firstNamePrefix: "Product",
    lastNamePrefix: "Owner",
    company: "Innovative Startups Inc",
    title: "Product Manager",
    annualRevenue: "5000000",
    companySize: 25,
    notes: "Early-stage startup seeking growth tools",
  },
  {
    firstNamePrefix: "IT",
    lastNamePrefix: "Specialist",
    company: "Enterprise Systems Ltd",
    title: "IT Manager",
    annualRevenue: "150000000",
    companySize: 750,
    notes: "Needs infrastructure modernization",
  },
];

/**
 * Generate test data for a single lead form
 * Returns realistic lead data with unique email, phone, and fax
 *
 * @param preserveEmail - Optional existing email to preserve (for edit mode)
 * @returns LeadRequestModel for form population
 */
export const generateLeadFormTest = (
  preserveEmail?: string
): LeadRequestModel => {
  const template =
    LEAD_TEMPLATES[Math.floor(Math.random() * LEAD_TEMPLATES.length)];
  const timestamp = Date.now();
  const randomStatus =
    LEAD_STATUSES[Math.floor(Math.random() * LEAD_STATUSES.length)];

  return {
    firstName: `${template.firstNamePrefix} Test`,
    lastName: `${template.lastNamePrefix} ${timestamp % 10000}`,
    email: preserveEmail ?? `nahushrai+lead_test${timestamp}@gmail.com`,
    phone: generatePhoneNumber(),
    leadStatus: randomStatus,
    company: template.company,
    companySize: template.companySize,
    annualRevenue: template.annualRevenue,
    title: template.title,
    website: `https://www.${template.company
      .toLowerCase()
      .replace(/\s+/g, "")}.com`,
    fax: generateFaxNumber(),
    address: {
      streetAddress: `${
        100 + Math.floor(Math.random() * 900)
      } Business Park Road`,
      streetAddress2: `Floor ${1 + Math.floor(Math.random() * 20)}`,
      streetAddress3: `Building ${String.fromCharCode(
        65 + Math.floor(Math.random() * 26)
      )}`,
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: getValidPincodeForCity("Mumbai"),
      country: "India",
      addressType: "OFFICE",
    },
    notes: template.notes,
  };
};

/**
 * Generate test data for lead bulk import
 * Creates an array of lead objects with varied test data including phone and fax
 *
 * @param numberOfRecords - Number of test lead records to generate
 * @returns Array of LeadRequestModel objects for import
 */
export const generateLeadImportTest = (
  numberOfRecords: number
): LeadRequestModel[] => {
  const leads: LeadRequestModel[] = [];
  const baseTimestamp = Date.now();

  for (let i = 0; i < numberOfRecords; i++) {
    const template = LEAD_TEMPLATES[i % LEAD_TEMPLATES.length];
    const timestamp = baseTimestamp + i;
    const randomStatus =
      LEAD_STATUSES[Math.floor(Math.random() * LEAD_STATUSES.length)];

    leads.push({
      firstName: `${template.firstNamePrefix} Test`,
      lastName: `${template.lastNamePrefix} ${i + 1}`,
      email: `nahushrai+lead_import${timestamp}@gmail.com`,
      phone: generatePhoneNumber(),
      leadStatus: randomStatus,
      company: template.company,
      companySize: template.companySize,
      annualRevenue: template.annualRevenue,
      title: template.title,
      website: `https://www.${template.company
        .toLowerCase()
        .replace(/\s+/g, "")}.com`,
      fax: generateFaxNumber(),
      address: {
        streetAddress: `${
          100 + Math.floor(Math.random() * 900)
        } Business Park Road`,
        streetAddress2: `Floor ${1 + Math.floor(Math.random() * 20)}`,
        streetAddress3: `Building ${String.fromCharCode(
          65 + Math.floor(Math.random() * 26)
        )}`,
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: getValidPincodeForCity("Mumbai"),
        country: "India",
        addressType: "OFFICE",
      },
      notes: template.notes,
    });
  }

  return leads;
};

// ============================================================================
// Promo Test Data Generation
// ============================================================================

/**
 * Promo template for test data generation
 */
interface PromoTemplate {
  codePrefix: string;
  description: string;
  discountValue: number;
  isPercent: boolean;
  notes: string;
}

/**
 * Pre-defined promo templates for variety in test data
 */
const PROMO_TEMPLATES: PromoTemplate[] = [
  {
    codePrefix: "SUMMER",
    description: "Summer sale discount - valid for all products",
    discountValue: 20,
    isPercent: true,
    notes: "Limited time summer promotion",
  },
  {
    codePrefix: "FLAT",
    description: "Flat discount on orders above ₹1000",
    discountValue: 100,
    isPercent: false,
    notes: "Applicable on minimum order of ₹1000",
  },
  {
    codePrefix: "WELCOME",
    description: "Welcome discount for new customers",
    discountValue: 15,
    isPercent: true,
    notes: "First order only",
  },
  {
    codePrefix: "FESTIVE",
    description: "Festive season special discount",
    discountValue: 25,
    isPercent: true,
    notes: "Valid during festive season",
  },
  {
    codePrefix: "LOYALTY",
    description: "Loyalty reward for returning customers",
    discountValue: 200,
    isPercent: false,
    notes: "For customers with 5+ orders",
  },
  {
    codePrefix: "FLASH",
    description: "Flash sale - limited time offer",
    discountValue: 30,
    isPercent: true,
    notes: "Valid for 24 hours only",
  },
  {
    codePrefix: "BULK",
    description: "Bulk order discount",
    discountValue: 500,
    isPercent: false,
    notes: "Minimum 10 items required",
  },
  {
    codePrefix: "VIP",
    description: "VIP customer exclusive discount",
    discountValue: 35,
    isPercent: true,
    notes: "VIP members only",
  },
];

/**
 * Generate test data for a single promo form
 * Returns realistic promo data with unique code
 *
 * @param preservePromoCode - Optional existing promo code to preserve (for edit mode)
 * @returns PromoRequestModel for form population
 */
export const generatePromoFormTest = (
  preservePromoCode?: string
): PromoRequestModel => {
  const template =
    PROMO_TEMPLATES[Math.floor(Math.random() * PROMO_TEMPLATES.length)];
  const timestamp = Date.now();

  // Generate start date (today + 5 days minimum for safety)
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Reset to midnight to avoid timezone issues
  startDate.setDate(startDate.getDate() + 5); // Always 5 days from today

  // Generate expiry date (1 day to 1 year from start date)
  const expiryDaysToAdd = 1 + Math.floor(Math.random() * 365); // Random between 1 and 365 days
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + expiryDaysToAdd);

  return {
    promoCode:
      preservePromoCode ?? `${template.codePrefix}_${timestamp % 100000}`,
    description: template.description,
    discountValue: template.discountValue,
    isPercent: template.isPercent,
    notes: template.notes,
    startDate: startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    expiryDate: expiryDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
  };
};

/**
 * Generate test data for promo bulk import
 * Creates an array of promo objects with varied test data
 *
 * @param numberOfRecords - Number of test promo records to generate
 * @returns Array of PromoRequestModel objects for import
 */
export const generatePromoImportTest = (
  numberOfRecords: number
): PromoRequestModel[] => {
  const promos: PromoRequestModel[] = [];
  const baseTimestamp = Date.now();

  for (let i = 0; i < numberOfRecords; i++) {
    const template = PROMO_TEMPLATES[i % PROMO_TEMPLATES.length];
    const timestamp = baseTimestamp + i;

    // Generate start date (today + 5 days minimum for safety, with some variation)
    const startDaysToAdd = 5 + Math.floor(Math.random() * 30); // Random between 5 and 34 days from today
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Reset to midnight to avoid timezone issues
    startDate.setDate(startDate.getDate() + startDaysToAdd);

    // Generate expiry date (1 day to 1 year from start date)
    const expiryDaysToAdd = 1 + Math.floor(Math.random() * 365); // Random between 1 and 365 days
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + expiryDaysToAdd);

    promos.push({
      promoCode: `${template.codePrefix}_${timestamp % 100000}`,
      description: template.description,
      discountValue: template.discountValue + Math.floor(Math.random() * 10),
      isPercent: template.isPercent,
      startDate: startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      expiryDate: expiryDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      notes: template.notes,
    });
  }

  return promos;
};

// ============================================================================
// Product Test Data Generation
// ============================================================================

/**
 * Product brands for random selection
 */
const PRODUCT_BRANDS = [
  "Apple",
  "Samsung",
  "Sony",
  "Nike",
  "Adidas",
  "LG",
  "Dell",
  "HP",
  "Lenovo",
  "ASUS",
  "Bose",
  "JBL",
  "Canon",
  "Nikon",
  "Dyson",
  "Philips",
  "Panasonic",
  "Xiaomi",
  "OnePlus",
  "Puma",
  "Reebok",
  "Under Armour",
  "Logitech",
  "Microsoft",
  "Razer",
] as const;

/**
 * Product adjectives for dynamic title generation
 */
const PRODUCT_ADJECTIVES = [
  "Premium",
  "Professional",
  "Advanced",
  "Ultimate",
  "Essential",
  "Classic",
  "Modern",
  "Compact",
  "Portable",
  "Wireless",
  "Smart",
  "Digital",
  "Ergonomic",
  "Lightweight",
  "Heavy Duty",
  "High Performance",
  "Energy Efficient",
  "Eco Friendly",
  "Waterproof",
  "Durable",
] as const;

/**
 * Product suffixes for dynamic title generation
 */
const PRODUCT_SUFFIXES = [
  "Edition",
  "Series",
  "Collection",
  "Version",
  "Gen 2",
  "Gen 3",
  "Plus",
  "Pro",
  "Max",
  "Ultra",
  "Lite",
  "Mini",
  "XL",
  "2024",
  "Mark II",
  "Special Edition",
  "Limited Edition",
  "Anniversary Edition",
] as const;

/**
 * Generate a random product title using the category name from database
 */
const generateProductTitle = (brand: string, categoryName: string): string => {
  const useAdjective = Math.random() > 0.3; // 70% chance to include adjective
  const useSuffix = Math.random() > 0.5; // 50% chance to include suffix

  const adjective = useAdjective
    ? PRODUCT_ADJECTIVES[Math.floor(Math.random() * PRODUCT_ADJECTIVES.length)]
    : "";
  const suffix = useSuffix
    ? PRODUCT_SUFFIXES[Math.floor(Math.random() * PRODUCT_SUFFIXES.length)]
    : "";

  // Build title parts
  const parts = [brand];
  if (adjective) parts.push(adjective);
  parts.push(categoryName);
  if (suffix) parts.push(suffix);

  return parts.join(" ");
};

/**
 * Model name prefixes for random model generation
 */
const MODEL_PREFIXES = [
  "Pro",
  "Elite",
  "Max",
  "Plus",
  "Ultra",
  "Premium",
  "Classic",
  "Sport",
  "Air",
  "Lite",
] as const;

/**
 * Generate a random UPC code
 */
const generateRandomUPC = (): string => {
  let upc = "";
  for (let i = 0; i < 12; i++) {
    upc += Math.floor(Math.random() * 10).toString();
  }
  return upc;
};

/**
 * Generate comprehensive HTML description for a product
 */
const generateProductDescription = (
  productType: string,
  brand: string,
  color: string,
  condition: string
): string => {
  const features = [
    "Premium build quality with attention to detail",
    "Engineered for optimal performance and durability",
    "Sleek and modern design that complements any style",
    "Easy to use with intuitive controls",
    "Energy efficient and environmentally friendly",
    "Backed by manufacturer warranty for peace of mind",
  ];

  const highlights = [
    "Industry-leading technology",
    "Exceptional value for money",
    "Customer favorite choice",
    "Award-winning design",
    "Top-rated by experts",
  ];

  // Build condition notes dynamically using PRODUCT_CONDITION_OPTIONS values
  const conditionNotes: Record<string, string> = {
    [PRODUCT_CONDITION_OPTIONS[0].value]:
      "Brand new, never used, with all original tags and packaging intact.",
    [PRODUCT_CONDITION_OPTIONS[1].value]:
      "Brand new condition, tags removed but never used or worn.",
    [PRODUCT_CONDITION_OPTIONS[2].value]:
      "New item with minor cosmetic imperfections that do not affect functionality.",
    [PRODUCT_CONDITION_OPTIONS[3].value]:
      "Gently used in excellent condition with minimal signs of wear.",
    [PRODUCT_CONDITION_OPTIONS[4].value]:
      "Previously owned with visible wear or minor functional issues noted.",
  };

  // Randomly select 3-4 features
  const shuffledFeatures = [...features]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3 + Math.floor(Math.random() * 2));

  // Randomly select 2-3 highlights
  const shuffledHighlights = [...highlights]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2 + Math.floor(Math.random() * 2));

  return `
    <div class="product-description">
      <h3>About This Product</h3>
      <p>Introducing the <strong>${brand} ${productType}</strong> in stunning <em>${color}</em>.
      This exceptional product combines cutting-edge technology with premium craftsmanship to deliver
      an unparalleled experience.</p>

      <h4>Key Features</h4>
      <ul>
        ${shuffledFeatures.map((f) => `<li>${f}</li>`).join("\n        ")}
      </ul>

      <h4>Why Choose This Product?</h4>
      <p>${shuffledHighlights.join(" • ")}</p>

      <h4>Product Condition</h4>
      <p><strong>${condition.replace(/_/g, " ")}:</strong> ${
    conditionNotes[condition] || "Standard condition."
  }</p>

      <h4>What's Included</h4>
      <ul>
        <li>1x ${brand} ${productType}</li>
        <li>User manual and documentation</li>
        <li>Original packaging (where applicable)</li>
        <li>Manufacturer warranty card</li>
      </ul>

      <blockquote>
        <p><em>"Quality is not an act, it is a habit."</em> - We stand behind every product we sell.</p>
      </blockquote>
    </div>
  `.trim();
};

/**
 * Generate random product notes based on condition
 */
const generateProductNotes = (condition: string): string => {
  // Build notes dynamically using PRODUCT_CONDITION_OPTIONS values
  const notesByCondition: Record<string, string[]> = {
    [PRODUCT_CONDITION_OPTIONS[0].value]: [
      "Factory sealed, never opened",
      "All original accessories included",
      "Perfect gift condition",
      "Includes manufacturer warranty",
      "Brand new in original packaging",
    ],
    [PRODUCT_CONDITION_OPTIONS[1].value]: [
      "New condition, packaging opened for inspection",
      "Never used, display item",
      "All accessories present",
      "Excellent condition, no defects",
      "Store display item, like new",
    ],
    [PRODUCT_CONDITION_OPTIONS[2].value]: [
      "Minor cosmetic scratch on surface",
      "Small dent that does not affect function",
      "Packaging damaged but product intact",
      "Minor scuff marks from shipping",
      "Slight discoloration, fully functional",
    ],
    [PRODUCT_CONDITION_OPTIONS[3].value]: [
      "Gently used, excellent condition",
      "Well maintained, minimal wear",
      "Previously loved, works perfectly",
      "Light use, no visible damage",
      "Great condition for pre-owned",
    ],
    [PRODUCT_CONDITION_OPTIONS[4].value]: [
      "Visible wear on exterior",
      "Minor functional quirk noted in description",
      "Shows signs of regular use",
      "Working condition with cosmetic issues",
      "Priced to sell, as-is condition",
    ],
  };

  const defaultNotes = notesByCondition[PRODUCT_CONDITION_OPTIONS[3].value];
  const notes = notesByCondition[condition] || defaultNotes;
  return notes[Math.floor(Math.random() * notes.length)];
};

/**
 * Generate realistic sample images for testing
 * Uses a mix of placeholder image services
 * @param hasDefect - Whether the item has a defect (determines if defectImage should be generated)
 */
const generateTestImages = (hasDefect: boolean, productIndex: number) => {
  // Use combination of timestamp, product index, and random number for truly unique seeds
  const uniqueBase = `${Date.now()}_${productIndex}_${Math.floor(
    Math.random() * 100000
  )}`;
  // Each image needs a unique random seed for picsum.photos to return different images
  const getImageUrl = (imageType: string): string =>
    `https://picsum.photos/seed/${uniqueBase}_${imageType}/400/400`;

  return {
    mainImage: getImageUrl("main"),
    topImage: getImageUrl("top"),
    bottomImage: getImageUrl("bottom"),
    frontImage: getImageUrl("front"),
    backImage: getImageUrl("back"),
    rightImage: getImageUrl("right"),
    leftImage: getImageUrl("left"),
    detailsImage: getImageUrl("details"),
    defectImage: hasDefect ? getImageUrl("defect") : "",
    additionalImage1: getImageUrl("add1"),
    additionalImage2: getImageUrl("add2"),
    additionalImage3: getImageUrl("add3"),
  };
};

/**
 * Recursively fetches categories until reaching a leaf node
 * Starts from root (parentId=null) and drills down randomly until isEnd=true
 *
 * @param parentId - Parent category ID (null for root categories)
 * @returns Promise<ProductCategoryWithPath> - A randomly selected leaf category
 */
const findRandomLeafCategory = async (
  parentId: number | null = null
): Promise<ProductCategoryWithPath | null> => {
  try {
    const categories = await productCategoryApi.getCategoriesByParentId(
      parentId
    );

    if (categories.length === 0) {
      return null;
    }

    // Randomly select a category from the current level
    const randomIndex = Math.floor(Math.random() * categories.length);
    const selectedCategory = categories[randomIndex];

    // If it's a leaf node (isEnd=true), return it
    if (selectedCategory.isEnd) {
      return selectedCategory;
    }

    // Otherwise, drill down into this category
    return findRandomLeafCategory(selectedCategory.categoryId);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return null;
  }
};

/**
 * Extended ProductRequestModel with category display information and form-specific fields
 */
export interface ProductTestData
  extends Omit<
    ProductRequestModel,
    "itemAvailableFrom" | "itemAvailableFromTimezone"
  > {
  categoryFullPath?: string;
  categoryParentId?: number | null;
  // Form uses a structured object for datetime with timezone
  itemAvailableFrom: {
    dateTime: Date;
    timezone: string;
  };
}

/**
 * Generate test data for product form
 * Creates a single product with randomly generated test data for form filling
 * Uses constants from appConstants for colors, countries, and conditions
 * Fetches real pickup location IDs and categories from the database
 *
 * @returns Promise<ProductTestData> for form population (includes categoryFullPath for display)
 */
export const generateProductFormTest = async (
  productIndex: number = 0
): Promise<ProductTestData> => {
  // Randomly select brand
  const brand =
    PRODUCT_BRANDS[Math.floor(Math.random() * PRODUCT_BRANDS.length)];
  const modelPrefix =
    MODEL_PREFIXES[Math.floor(Math.random() * MODEL_PREFIXES.length)];
  const modelNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  const model = `${modelPrefix} ${modelNumber}`;

  // Random color from PRODUCT_COLOR_OPTIONS
  const randomColor =
    PRODUCT_COLOR_OPTIONS[
      Math.floor(Math.random() * PRODUCT_COLOR_OPTIONS.length)
    ];
  const color = randomColor.hex;
  const colorLabel = randomColor.name;

  // Random condition from PRODUCT_CONDITION_OPTIONS
  const randomCondition =
    PRODUCT_CONDITION_OPTIONS[
      Math.floor(Math.random() * PRODUCT_CONDITION_OPTIONS.length)
    ];
  const condition = randomCondition.value;

  // Random country from COUNTRIES
  const countryOfManufacture =
    COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

  // Check if condition has defects for image generation
  const hasDefect = condition.includes("DEFECT");
  const images = generateTestImages(hasDefect, productIndex);

  // Generate random dimensions and weight
  const length = 10 + Math.floor(Math.random() * 40); // 10-50 cm
  const breadth = 10 + Math.floor(Math.random() * 40); // 10-50 cm
  const height = 5 + Math.floor(Math.random() * 30); // 5-35 cm
  const weightKgs = 0.5 + Math.random() * 4.5; // 0.5-5 kg

  // Fetch a random leaf category by drilling down from root
  let categoryId = 1; // Default fallback
  let categoryFullPath = ""; // Store the full path for display
  let categoryParentId: number | null = null; // Store parent ID for navigation
  try {
    const leafCategory = await findRandomLeafCategory(null);
    if (leafCategory) {
      categoryId = leafCategory.categoryId;
      categoryFullPath = leafCategory.fullPath;
      categoryParentId = leafCategory.parentId;
    }
  } catch (error) {
    console.warn("Failed to fetch leaf category, using default:", error);
  }

  // Generate random modification flag (30% chance of being modified)
  const itemModified = Math.random() > 0.7;

  // Generate random price (₹500 - ₹200,000)
  const price = Math.floor(Math.random() * 199500) + 500;

  // Generate random discount (0-50% or ₹0-₹10,000)
  const isDiscountPercent = Math.random() > 0.5;
  const discount = isDiscountPercent
    ? Math.floor(Math.random() * 51) // 0-50%
    : Math.floor(Math.random() * 10001); // ₹0-₹10,000

  // Random return window (70% chance of returns allowed, 30 days when allowed)
  const returnWindowDays = Math.random() > 0.3 ? 30 : 0;

  // Fetch real pickup locations from database and randomly select 5
  const pickupLocationQuantities: Record<string, number> = {};
  try {
    const response = await pickupLocationApi.getPickupLocationsInBatches({
      start: 0,
      end: 50,
      pageSize: 50,
    });

    // Extract pickup location data from response
    const locations = (response.data || []) as Array<{
      pickupLocationId: number;
    }>;

    if (locations.length > 0) {
      // Randomly select 5 locations (or fewer if less than 5 available)
      const numLocations = Math.min(5, locations.length);
      const shuffled = [...locations].sort(() => Math.random() - 0.5);
      const selectedLocations = shuffled.slice(0, numLocations);

      // Build pickupLocationQuantities with selected locations and random quantities
      selectedLocations.forEach((location) => {
        const quantity = 5 + Math.floor(Math.random() * 46); // Random quantity 5-50
        pickupLocationQuantities[location.pickupLocationId.toString()] =
          quantity;
      });
    }
  } catch (error) {
    console.warn("Failed to fetch pickup locations for test data:", error);
    // If API fails, leave pickup locations empty
  }

  // Extract category name from full path (last segment after " > ")
  const categoryName = categoryFullPath
    ? categoryFullPath.split(" > ").pop() || "Product"
    : "Product";

  // Generate product title using brand and category name from database
  const title = generateProductTitle(brand, categoryName);

  // Generate comprehensive HTML description
  const descriptionHtml = generateProductDescription(
    categoryName,
    brand,
    colorLabel,
    condition
  );

  // Generate notes based on condition
  const notes = generateProductNotes(condition);

  // Generate a future availability date (1-30 days from now)
  const daysInFuture = 1 + Math.floor(Math.random() * 30);
  const hoursInDay = Math.floor(Math.random() * 24);
  const minutesInHour = Math.floor(Math.random() * 60);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysInFuture);
  futureDate.setHours(hoursInDay, minutesInHour, 0, 0);

  // Random timezone selection (prefer Indian timezone for test data)
  const timezones = [
    "Asia/Kolkata",
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
  ];
  const randomTimezone =
    timezones[Math.floor(Math.random() * timezones.length)];

  return {
    title,
    descriptionHtml,
    brand,
    model,
    condition,
    color,
    colorLabel,
    upc: generateRandomUPC(),
    countryOfManufacture,
    itemModified,
    modificationHtml: itemModified
      ? `<div class="modifications">
          <h4>Custom Modifications</h4>
          <ul>
            <li>Enhanced cooling system for better thermal management</li>
            <li>Upgraded internal components for improved performance</li>
            <li>Custom firmware/software optimizations</li>
            <li>Additional accessories included</li>
          </ul>
          <p><em>Note: Modifications performed by certified technicians.</em></p>
        </div>`
      : undefined,
    price,
    discount,
    isDiscountPercent,
    returnWindowDays,
    length: Math.round(length * 100) / 100,
    breadth: Math.round(breadth * 100) / 100,
    height: Math.round(height * 100) / 100,
    weightKgs: Math.round(weightKgs * 100) / 100,
    categoryId,
    categoryFullPath, // Include full path for display in CategoryAutocomplete
    categoryParentId, // Include parent ID for navigation state
    mainImage: images.mainImage,
    topImage: images.topImage,
    bottomImage: images.bottomImage,
    frontImage: images.frontImage,
    backImage: images.backImage,
    rightImage: images.rightImage,
    leftImage: images.leftImage,
    detailsImage: images.detailsImage,
    defectImage: images.defectImage || undefined,
    additionalImage1: images.additionalImage1 || undefined,
    additionalImage2: images.additionalImage2 || undefined,
    additionalImage3: images.additionalImage3 || undefined,
    pickupLocationQuantities,
    notes,
    itemAvailableFrom: {
      dateTime: futureDate,
      timezone: randomTimezone,
    },
  };
};

// ============================================================================
// Package Test Data Generation
// ============================================================================

/**
 * Package types matching database constraint
 */
const PACKAGE_TYPES = [
  "STANDARD",
  "FRAGILE",
  "OVERSIZED",
  "ENVELOPE",
  "BOX",
  "TUBE",
  "CUSTOM",
] as const;

/**
 * Package name templates for variety in test data
 */
const PACKAGE_NAME_TEMPLATES = [
  { prefix: "Small", suffix: "Box" },
  { prefix: "Medium", suffix: "Box" },
  { prefix: "Large", suffix: "Box" },
  { prefix: "Extra Large", suffix: "Container" },
  { prefix: "Compact", suffix: "Mailer" },
  { prefix: "Flat", suffix: "Envelope" },
  { prefix: "Padded", suffix: "Envelope" },
  { prefix: "Bubble", suffix: "Mailer" },
  { prefix: "Fragile Item", suffix: "Box" },
  { prefix: "Heavy Duty", suffix: "Crate" },
  { prefix: "Poster", suffix: "Tube" },
  { prefix: "Document", suffix: "Sleeve" },
  { prefix: "Gift", suffix: "Box" },
  { prefix: "Electronics", suffix: "Case" },
  { prefix: "Clothing", suffix: "Bag" },
] as const;

/**
 * Package notes templates
 */
const PACKAGE_NOTES = [
  "Standard shipping package for general merchandise",
  "Reinforced corners for extra protection",
  "Weather-resistant material",
  "Ideal for fragile items requiring extra care",
  "Eco-friendly recyclable packaging",
  "Self-sealing adhesive strip included",
  "Compatible with automated sorting systems",
  "Meets international shipping standards",
  "Stackable design for efficient storage",
  "Includes packing slip pouch",
];

// Re-export from api-models for convenience in test data generation
export type {
  PackagePickupLocationMappingRequestModel,
  PackageRequestModel,
} from "../models/api-models/PackageModels";

/**
 * Generate test data for a single package form
 * Creates a package with randomly generated test data
 * Fetches real pickup location IDs from the database
 *
 * @param preserveName - Optional existing name to preserve (for edit mode)
 * @returns Promise<PackageRequestModel> for form population
 */
export const generatePackageFormTest = async (
  preserveName?: string
): Promise<PackageRequestModel> => {
  const template =
    PACKAGE_NAME_TEMPLATES[
      Math.floor(Math.random() * PACKAGE_NAME_TEMPLATES.length)
    ];
  const timestamp = Date.now();

  // Random dimensions
  const length = 10 + Math.floor(Math.random() * 90); // 10-100 cm
  const breadth = 10 + Math.floor(Math.random() * 60); // 10-70 cm
  const height = 5 + Math.floor(Math.random() * 50); // 5-55 cm

  // Random weight and capacity
  const maxWeight = Math.round((1 + Math.random() * 29) * 100) / 100; // 1-30 kg, 2 decimal places
  const standardCapacity = 1 + Math.floor(Math.random() * 20); // 1-20 items

  // Random price (₹10 - ₹500)
  const pricePerUnit = Math.round((10 + Math.random() * 490) * 100) / 100;

  // Random package type
  const packageType =
    PACKAGE_TYPES[Math.floor(Math.random() * PACKAGE_TYPES.length)];

  // Random notes
  const notes = PACKAGE_NOTES[Math.floor(Math.random() * PACKAGE_NOTES.length)];

  // Fetch real pickup locations from database and randomly select 3-5
  const pickupLocationQuantities: Record<
    string,
    PackagePickupLocationMappingRequestModel
  > = {};
  try {
    const response = await pickupLocationApi.getPickupLocationsInBatches({
      start: 0,
      end: 50,
      pageSize: 50,
    });

    // Extract pickup location data from response
    const locations = (response.data || []) as Array<{
      pickupLocationId: number;
    }>;

    if (locations.length > 0) {
      // Randomly select 3-5 locations (or fewer if less available)
      const numLocations = Math.min(
        3 + Math.floor(Math.random() * 3),
        locations.length
      ); // 3-5 locations
      const shuffled = [...locations].sort(() => Math.random() - 0.5);
      const selectedLocations = shuffled.slice(0, numLocations);

      // Build pickupLocationQuantities with selected locations and random inventory data
      selectedLocations.forEach((location) => {
        const quantity = 10 + Math.floor(Math.random() * 100); // Random quantity 10-110
        const reorderLevel = Math.floor(quantity * 0.2); // 20% of quantity
        const maxStockLevel = quantity * 2; // Double the current quantity
        // Randomly add last restock date (50% chance)
        const lastRestockDate =
          Math.random() > 0.5
            ? new Date(
                Date.now() -
                  Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
              ).toISOString()
            : undefined;

        pickupLocationQuantities[location.pickupLocationId.toString()] = {
          quantity,
          reorderLevel,
          maxStockLevel,
          lastRestockDate,
        };
      });
    }
  } catch (error) {
    console.warn(
      "Failed to fetch pickup locations for package test data:",
      error
    );
    // If API fails, leave pickup locations empty
  }

  return {
    packageName:
      preserveName ??
      `${template.prefix} ${template.suffix} - ${timestamp % 100000}`,
    length,
    breadth,
    height,
    maxWeight,
    standardCapacity,
    pricePerUnit,
    packageType,
    notes,
    pickupLocationQuantities,
  };
};

/**
 * Generate test data for package bulk import
 * Creates an array of package objects with varied test data
 *
 * @param numberOfRecords - Number of test package records to generate
 * @returns Array of PackageRequestModel objects for import
 */
export const generatePackageImportTest = (
  numberOfRecords: number
): PackageRequestModel[] => {
  const packages: PackageRequestModel[] = [];
  const baseTimestamp = Date.now();

  for (let i = 0; i < numberOfRecords; i++) {
    const template = PACKAGE_NAME_TEMPLATES[i % PACKAGE_NAME_TEMPLATES.length];
    const timestamp = baseTimestamp + i;

    // Vary dimensions based on template
    const sizeMultiplier = i % 3 === 0 ? 1 : i % 3 === 1 ? 1.5 : 2;
    const length = Math.floor(
      (15 + Math.floor(Math.random() * 40)) * sizeMultiplier
    );
    const breadth = Math.floor(
      (10 + Math.floor(Math.random() * 30)) * sizeMultiplier
    );
    const height = Math.floor(
      (8 + Math.floor(Math.random() * 25)) * sizeMultiplier
    );

    // Weight and capacity scale with size
    const maxWeight =
      Math.round((2 + Math.random() * 15) * sizeMultiplier * 100) / 100;
    const standardCapacity = Math.floor(
      (2 + Math.random() * 8) * sizeMultiplier
    );

    // Price scales with size
    const pricePerUnit =
      Math.round((20 + Math.random() * 100) * sizeMultiplier * 100) / 100;

    // Cycle through package types
    const packageType = PACKAGE_TYPES[i % PACKAGE_TYPES.length];

    packages.push({
      packageName: `${template.prefix} ${template.suffix} - ${
        timestamp % 100000
      }`,
      length,
      breadth,
      height,
      maxWeight,
      standardCapacity,
      pricePerUnit,
      packageType,
      notes: PACKAGE_NOTES[i % PACKAGE_NOTES.length],
    });
  }

  return packages;
};

// ============================================================================
// Pickup Location Test Data Generation
// ============================================================================

/**
 * Pickup location name templates for variety in test data
 */
const PICKUP_LOCATION_TEMPLATES = [
  { name: "Main Warehouse", type: "WAREHOUSE" },
  { name: "Downtown Store", type: "STORE" },
  { name: "Airport Hub", type: "WAREHOUSE" },
  { name: "City Center Outlet", type: "STORE" },
  { name: "Industrial Zone Depot", type: "WAREHOUSE" },
  { name: "Mall Kiosk", type: "STORE" },
  { name: "Distribution Center", type: "WAREHOUSE" },
  { name: "Express Pickup Point", type: "STORE" },
  { name: "Regional Hub", type: "WAREHOUSE" },
  { name: "Premium Showroom", type: "STORE" },
  { name: "Fulfillment Center", type: "WAREHOUSE" },
  { name: "Neighborhood Store", type: "STORE" },
] as const;

/**
 * Indian states for test data
 */
const INDIAN_STATES = [
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "Rajasthan",
  "West Bengal",
  "Uttar Pradesh",
  "Telangana",
  "Kerala",
] as const;

/**
 * Valid pincode ranges by city (based on India Post data)
 * Each city has an array of valid pincodes to randomly select from
 */
const VALID_PINCODES_BY_CITY: Record<string, string[]> = {
  // Maharashtra
  Mumbai: [
    "400001",
    "400002",
    "400003",
    "400004",
    "400005",
    "400006",
    "400007",
    "400008",
    "400009",
    "400010",
    "400011",
    "400012",
    "400013",
    "400014",
    "400015",
    "400016",
    "400017",
    "400018",
    "400019",
    "400020",
    "400021",
    "400022",
    "400023",
    "400024",
    "400025",
    "400026",
    "400027",
    "400028",
    "400029",
    "400030",
    "400031",
    "400032",
    "400033",
    "400034",
    "400036",
    "400037",
    "400039",
    "400042",
    "400043",
    "400049",
    "400050",
    "400051",
    "400052",
    "400053",
    "400054",
    "400055",
    "400056",
    "400057",
    "400058",
    "400059",
    "400060",
    "400061",
    "400062",
    "400063",
    "400064",
    "400065",
    "400066",
    "400067",
    "400068",
    "400069",
    "400070",
    "400071",
    "400072",
    "400074",
    "400075",
    "400076",
    "400077",
    "400078",
    "400079",
    "400080",
    "400081",
    "400082",
    "400083",
    "400084",
    "400085",
    "400086",
    "400087",
    "400088",
    "400089",
    "400090",
    "400091",
    "400092",
    "400093",
    "400094",
    "400095",
    "400096",
    "400097",
    "400098",
    "400099",
    "400101",
    "400102",
    "400103",
    "400104",
  ],
  Pune: [
    "411001",
    "411002",
    "411003",
    "411004",
    "411005",
    "411006",
    "411007",
    "411008",
    "411009",
    "411011",
    "411012",
    "411013",
    "411014",
    "411015",
    "411016",
    "411017",
    "411018",
    "411019",
    "411020",
    "411021",
    "411022",
    "411023",
    "411024",
    "411025",
    "411026",
    "411027",
    "411028",
    "411029",
    "411030",
    "411031",
    "411032",
    "411033",
    "411034",
    "411035",
    "411036",
    "411037",
    "411038",
    "411039",
    "411040",
    "411041",
    "411042",
    "411043",
    "411044",
    "411045",
    "411046",
    "411047",
    "411048",
    "411051",
    "411052",
    "411057",
    "411058",
    "411060",
    "411061",
    "411062",
  ],
  Nagpur: [
    "440001",
    "440002",
    "440003",
    "440004",
    "440005",
    "440006",
    "440007",
    "440008",
    "440009",
    "440010",
    "440012",
    "440013",
    "440014",
    "440015",
    "440016",
    "440017",
    "440018",
    "440019",
    "440020",
    "440021",
    "440022",
    "440023",
    "440024",
    "440025",
    "440026",
    "440027",
    "440030",
    "440032",
    "440033",
    "440034",
    "440035",
  ],
  Nashik: [
    "422001",
    "422002",
    "422003",
    "422004",
    "422005",
    "422006",
    "422007",
    "422008",
    "422009",
    "422010",
    "422011",
    "422012",
    "422013",
  ],
  Thane: [
    "400601",
    "400602",
    "400603",
    "400604",
    "400605",
    "400606",
    "400607",
    "400608",
    "400610",
    "400612",
    "400614",
    "400615",
  ],
  // Karnataka
  Bangalore: [
    "560001",
    "560002",
    "560003",
    "560004",
    "560005",
    "560006",
    "560007",
    "560008",
    "560009",
    "560010",
    "560011",
    "560012",
    "560013",
    "560014",
    "560015",
    "560016",
    "560017",
    "560018",
    "560019",
    "560020",
    "560021",
    "560022",
    "560023",
    "560024",
    "560025",
    "560026",
    "560027",
    "560028",
    "560029",
    "560030",
    "560032",
    "560033",
    "560034",
    "560035",
    "560036",
    "560037",
    "560038",
    "560039",
    "560040",
    "560041",
    "560042",
    "560043",
    "560045",
    "560046",
    "560047",
    "560048",
    "560049",
    "560050",
    "560051",
    "560052",
    "560053",
    "560054",
    "560055",
    "560056",
    "560057",
    "560058",
    "560059",
    "560060",
    "560061",
    "560062",
    "560063",
    "560064",
    "560065",
    "560066",
    "560067",
    "560068",
    "560069",
    "560070",
    "560071",
    "560072",
    "560073",
    "560074",
    "560075",
    "560076",
    "560077",
    "560078",
    "560079",
    "560080",
    "560083",
    "560084",
    "560085",
    "560086",
    "560087",
    "560089",
    "560090",
    "560091",
    "560092",
    "560093",
    "560094",
    "560095",
    "560096",
    "560097",
    "560098",
    "560099",
    "560100",
    "560102",
    "560103",
    "560104",
    "560105",
    "560107",
    "560108",
    "560109",
    "560110",
    "560111",
    "560112",
    "560113",
    "560114",
  ],
  Mysore: [
    "570001",
    "570002",
    "570003",
    "570004",
    "570005",
    "570006",
    "570007",
    "570008",
    "570009",
    "570010",
    "570011",
    "570012",
    "570014",
    "570015",
    "570016",
    "570017",
    "570018",
    "570019",
    "570020",
    "570021",
    "570022",
    "570023",
    "570024",
    "570025",
    "570026",
    "570027",
    "570028",
    "570029",
    "570030",
    "570031",
  ],
  Mangalore: [
    "575001",
    "575002",
    "575003",
    "575004",
    "575005",
    "575006",
    "575007",
    "575008",
    "575010",
    "575011",
    "575013",
    "575014",
    "575015",
    "575016",
    "575017",
    "575018",
    "575019",
    "575020",
    "575022",
    "575023",
    "575025",
    "575028",
    "575029",
    "575030",
  ],
  Hubli: [
    "580001",
    "580002",
    "580003",
    "580004",
    "580005",
    "580006",
    "580007",
    "580008",
    "580009",
    "580010",
    "580011",
    "580012",
    "580013",
    "580014",
    "580015",
    "580016",
    "580017",
    "580018",
    "580019",
    "580020",
    "580021",
    "580022",
    "580023",
    "580024",
    "580025",
    "580026",
    "580027",
    "580028",
    "580029",
    "580030",
    "580031",
    "580032",
  ],
  Belgaum: [
    "590001",
    "590002",
    "590003",
    "590004",
    "590005",
    "590006",
    "590008",
    "590009",
    "590010",
    "590011",
    "590014",
    "590015",
    "590016",
    "590018",
    "590019",
  ],
  // Tamil Nadu
  Chennai: [
    "600001",
    "600002",
    "600003",
    "600004",
    "600005",
    "600006",
    "600007",
    "600008",
    "600009",
    "600010",
    "600011",
    "600012",
    "600013",
    "600014",
    "600015",
    "600016",
    "600017",
    "600018",
    "600019",
    "600020",
    "600021",
    "600022",
    "600023",
    "600024",
    "600025",
    "600026",
    "600027",
    "600028",
    "600029",
    "600030",
    "600031",
    "600032",
    "600033",
    "600034",
    "600035",
    "600036",
    "600037",
    "600038",
    "600039",
    "600040",
    "600041",
    "600042",
    "600044",
    "600045",
    "600046",
    "600047",
    "600048",
    "600049",
    "600050",
    "600051",
    "600052",
    "600053",
    "600054",
    "600055",
    "600056",
    "600057",
    "600058",
    "600059",
    "600060",
    "600061",
    "600062",
    "600063",
    "600064",
    "600065",
    "600066",
    "600068",
    "600069",
    "600070",
    "600071",
    "600072",
    "600073",
    "600074",
    "600075",
    "600077",
    "600078",
    "600079",
    "600080",
    "600081",
    "600082",
    "600083",
    "600084",
    "600085",
    "600086",
    "600087",
    "600088",
    "600089",
    "600090",
    "600091",
    "600092",
    "600093",
    "600094",
    "600095",
    "600096",
    "600097",
    "600098",
    "600099",
    "600100",
    "600101",
    "600102",
    "600103",
    "600104",
    "600106",
    "600107",
    "600108",
    "600109",
    "600110",
    "600112",
    "600113",
    "600114",
    "600115",
    "600116",
    "600117",
    "600118",
    "600119",
    "600122",
    "600123",
    "600124",
    "600125",
    "600126",
    "600127",
    "600128",
    "600129",
    "600130",
  ],
  Coimbatore: [
    "641001",
    "641002",
    "641003",
    "641004",
    "641005",
    "641006",
    "641007",
    "641008",
    "641009",
    "641010",
    "641011",
    "641012",
    "641013",
    "641014",
    "641015",
    "641016",
    "641017",
    "641018",
    "641019",
    "641020",
    "641021",
    "641022",
    "641023",
    "641024",
    "641025",
    "641026",
    "641027",
    "641028",
    "641029",
    "641030",
    "641031",
    "641032",
    "641033",
    "641034",
    "641035",
    "641036",
    "641037",
    "641038",
    "641039",
    "641040",
    "641041",
    "641042",
    "641043",
    "641044",
    "641045",
    "641046",
    "641047",
    "641048",
    "641049",
    "641050",
    "641062",
  ],
  Madurai: [
    "625001",
    "625002",
    "625003",
    "625004",
    "625005",
    "625006",
    "625007",
    "625008",
    "625009",
    "625010",
    "625011",
    "625012",
    "625013",
    "625014",
    "625015",
    "625016",
    "625017",
    "625018",
    "625019",
    "625020",
    "625021",
    "625022",
  ],
  Salem: [
    "636001",
    "636002",
    "636003",
    "636004",
    "636005",
    "636006",
    "636007",
    "636008",
    "636009",
    "636010",
    "636011",
    "636012",
    "636013",
    "636014",
    "636015",
    "636016",
  ],
  Tiruchirappalli: [
    "620001",
    "620002",
    "620003",
    "620004",
    "620005",
    "620006",
    "620007",
    "620008",
    "620009",
    "620010",
    "620011",
    "620012",
    "620013",
    "620014",
    "620015",
    "620016",
    "620017",
    "620018",
    "620019",
    "620020",
    "620021",
    "620022",
    "620023",
    "620024",
    "620025",
    "620026",
    "620027",
  ],
  // Delhi
  "New Delhi": [
    "110001",
    "110002",
    "110003",
    "110004",
    "110005",
    "110006",
    "110007",
    "110008",
    "110009",
    "110010",
    "110011",
    "110012",
    "110013",
    "110014",
    "110015",
    "110016",
    "110017",
    "110018",
    "110019",
    "110020",
    "110021",
    "110022",
    "110023",
    "110024",
    "110025",
    "110026",
    "110027",
    "110028",
    "110029",
    "110030",
  ],
  "South Delhi": [
    "110017",
    "110019",
    "110020",
    "110023",
    "110024",
    "110025",
    "110030",
    "110044",
    "110049",
    "110062",
    "110065",
    "110067",
    "110068",
    "110070",
    "110074",
    "110076",
  ],
  "North Delhi": [
    "110006",
    "110007",
    "110009",
    "110033",
    "110035",
    "110036",
    "110039",
    "110040",
    "110042",
    "110052",
    "110054",
    "110084",
    "110086",
    "110088",
  ],
  "East Delhi": [
    "110031",
    "110032",
    "110051",
    "110053",
    "110091",
    "110092",
    "110093",
    "110095",
    "110096",
  ],
  "West Delhi": [
    "110015",
    "110018",
    "110026",
    "110027",
    "110041",
    "110045",
    "110046",
    "110056",
    "110057",
    "110058",
    "110059",
    "110060",
    "110063",
    "110064",
    "110066",
    "110071",
    "110073",
    "110075",
    "110078",
    "110081",
    "110087",
  ],
  // Gujarat
  Ahmedabad: [
    "380001",
    "380002",
    "380003",
    "380004",
    "380005",
    "380006",
    "380007",
    "380008",
    "380009",
    "380010",
    "380013",
    "380014",
    "380015",
    "380016",
    "380018",
    "380019",
    "380021",
    "380022",
    "380023",
    "380024",
    "380025",
    "380026",
    "380027",
    "380028",
    "380050",
    "380051",
    "380052",
    "380053",
    "380054",
    "380055",
    "380058",
    "380059",
    "380060",
    "380061",
    "380063",
  ],
  Surat: [
    "395001",
    "395002",
    "395003",
    "395004",
    "395005",
    "395006",
    "395007",
    "395008",
    "395009",
    "395010",
    "395011",
    "395012",
    "395017",
  ],
  Vadodara: [
    "390001",
    "390002",
    "390003",
    "390004",
    "390005",
    "390006",
    "390007",
    "390008",
    "390009",
    "390010",
    "390011",
    "390012",
    "390013",
    "390014",
    "390015",
    "390016",
    "390017",
    "390018",
    "390019",
    "390020",
    "390021",
    "390022",
    "390023",
    "390024",
    "390025",
  ],
  Rajkot: [
    "360001",
    "360002",
    "360003",
    "360004",
    "360005",
    "360006",
    "360007",
  ],
  Gandhinagar: [
    "382001",
    "382006",
    "382007",
    "382009",
    "382010",
    "382016",
    "382020",
    "382021",
    "382022",
    "382023",
    "382024",
    "382028",
    "382029",
    "382030",
    "382040",
    "382041",
    "382042",
    "382043",
    "382044",
    "382045",
    "382051",
    "382305",
    "382308",
    "382315",
    "382320",
    "382325",
    "382330",
    "382340",
    "382345",
    "382350",
    "382352",
    "382355",
    "382405",
    "382415",
    "382418",
    "382421",
    "382424",
    "382426",
    "382427",
    "382428",
    "382430",
    "382433",
    "382435",
    "382440",
    "382443",
    "382445",
    "382449",
    "382450",
    "382455",
    "382460",
    "382463",
    "382465",
    "382470",
    "382475",
    "382480",
    "382481",
  ],
  Bhavnagar: ["364001", "364002", "364003", "364004", "364005", "364006"],
  // Rajasthan
  Jaipur: [
    "302001",
    "302002",
    "302003",
    "302004",
    "302005",
    "302006",
    "302007",
    "302008",
    "302010",
    "302011",
    "302012",
    "302013",
    "302015",
    "302016",
    "302017",
    "302018",
    "302019",
    "302020",
    "302021",
    "302022",
    "302023",
    "302024",
    "302025",
    "302026",
    "302027",
    "302028",
    "302029",
    "302030",
    "302031",
    "302032",
    "302033",
    "302034",
    "302036",
    "302037",
    "302039",
  ],
  Jodhpur: [
    "342001",
    "342002",
    "342003",
    "342004",
    "342005",
    "342006",
    "342007",
    "342008",
    "342009",
    "342010",
    "342011",
    "342012",
    "342013",
    "342014",
    "342015",
    "342024",
    "342025",
    "342026",
    "342027",
  ],
  Udaipur: [
    "313001",
    "313002",
    "313003",
    "313004",
    "313011",
    "313015",
    "313024",
    "313026",
    "313027",
    "313031",
  ],
  Kota: [
    "324001",
    "324002",
    "324003",
    "324004",
    "324005",
    "324006",
    "324007",
    "324008",
    "324009",
    "324010",
  ],
  Ajmer: [
    "305001",
    "305002",
    "305003",
    "305004",
    "305005",
    "305006",
    "305007",
    "305008",
    "305009",
    "305012",
    "305021",
    "305022",
    "305023",
    "305024",
    "305025",
  ],
  // West Bengal
  Kolkata: [
    "700001",
    "700002",
    "700003",
    "700004",
    "700005",
    "700006",
    "700007",
    "700008",
    "700009",
    "700010",
    "700011",
    "700012",
    "700013",
    "700014",
    "700015",
    "700016",
    "700017",
    "700018",
    "700019",
    "700020",
    "700021",
    "700022",
    "700023",
    "700024",
    "700025",
    "700026",
    "700027",
    "700028",
    "700029",
    "700030",
    "700031",
    "700032",
    "700033",
    "700034",
    "700035",
    "700036",
    "700037",
    "700038",
    "700039",
    "700040",
    "700041",
    "700042",
    "700043",
    "700044",
    "700045",
    "700046",
    "700047",
    "700048",
    "700049",
    "700050",
    "700051",
    "700052",
    "700053",
    "700054",
    "700055",
    "700056",
    "700057",
    "700058",
    "700059",
    "700060",
    "700061",
    "700062",
    "700063",
    "700064",
    "700065",
    "700066",
    "700067",
    "700068",
    "700069",
    "700070",
    "700071",
    "700072",
    "700073",
    "700074",
    "700075",
    "700076",
    "700077",
    "700078",
    "700079",
    "700080",
    "700081",
    "700082",
    "700083",
    "700084",
    "700085",
    "700086",
    "700087",
    "700088",
    "700089",
    "700090",
    "700091",
    "700092",
    "700093",
    "700094",
    "700095",
    "700096",
    "700097",
    "700098",
    "700099",
    "700100",
    "700101",
    "700102",
    "700103",
    "700104",
    "700105",
    "700106",
    "700107",
    "700108",
    "700109",
    "700110",
    "700111",
    "700112",
    "700113",
    "700114",
    "700115",
    "700116",
    "700117",
    "700118",
    "700119",
    "700120",
    "700121",
    "700122",
    "700123",
    "700124",
    "700125",
    "700126",
    "700127",
    "700128",
    "700129",
    "700130",
    "700131",
    "700132",
    "700133",
    "700134",
    "700135",
    "700136",
    "700137",
    "700138",
    "700139",
    "700140",
    "700141",
    "700142",
    "700143",
    "700144",
    "700145",
    "700146",
    "700147",
    "700148",
    "700149",
    "700150",
    "700151",
    "700152",
    "700153",
    "700154",
    "700155",
    "700156",
    "700157",
  ],
  Howrah: [
    "711101",
    "711102",
    "711103",
    "711104",
    "711105",
    "711106",
    "711107",
    "711108",
    "711109",
    "711110",
    "711111",
    "711112",
    "711113",
    "711114",
    "711201",
    "711202",
    "711203",
    "711204",
    "711205",
    "711301",
    "711302",
    "711303",
    "711304",
    "711305",
    "711306",
    "711307",
    "711308",
    "711309",
    "711310",
    "711311",
    "711312",
    "711313",
    "711314",
    "711315",
    "711316",
    "711317",
    "711401",
    "711402",
    "711403",
    "711404",
    "711405",
    "711406",
    "711407",
    "711408",
    "711409",
    "711410",
    "711411",
    "711412",
    "711413",
    "711414",
    "711415",
  ],
  Durgapur: [
    "713201",
    "713202",
    "713203",
    "713204",
    "713205",
    "713206",
    "713207",
    "713208",
    "713209",
    "713210",
    "713211",
    "713212",
    "713213",
    "713214",
    "713215",
    "713216",
  ],
  Asansol: [
    "713301",
    "713302",
    "713303",
    "713304",
    "713305",
    "713321",
    "713322",
    "713323",
    "713324",
    "713325",
    "713326",
    "713331",
    "713332",
    "713333",
    "713334",
    "713335",
    "713336",
    "713337",
    "713338",
    "713339",
    "713340",
    "713341",
    "713342",
    "713343",
    "713344",
    "713345",
    "713346",
    "713347",
  ],
  Siliguri: [
    "734001",
    "734002",
    "734003",
    "734004",
    "734005",
    "734006",
    "734007",
    "734008",
    "734009",
    "734010",
    "734011",
    "734012",
    "734013",
    "734014",
    "734015",
    "734016",
  ],
  // Uttar Pradesh
  Lucknow: [
    "226001",
    "226002",
    "226003",
    "226004",
    "226005",
    "226006",
    "226007",
    "226008",
    "226010",
    "226011",
    "226012",
    "226013",
    "226014",
    "226015",
    "226016",
    "226017",
    "226018",
    "226019",
    "226020",
    "226021",
    "226022",
    "226023",
    "226024",
    "226025",
    "226026",
    "226027",
    "226028",
    "226029",
    "226030",
  ],
  Kanpur: [
    "208001",
    "208002",
    "208003",
    "208004",
    "208005",
    "208006",
    "208007",
    "208008",
    "208009",
    "208010",
    "208011",
    "208012",
    "208013",
    "208014",
    "208015",
    "208016",
    "208017",
    "208018",
    "208019",
    "208020",
    "208021",
    "208022",
    "208023",
    "208024",
    "208025",
    "208026",
    "208027",
  ],
  Noida: [
    "201301",
    "201303",
    "201304",
    "201305",
    "201306",
    "201307",
    "201309",
    "201310",
  ],
  Ghaziabad: [
    "201001",
    "201002",
    "201003",
    "201004",
    "201005",
    "201006",
    "201007",
    "201008",
    "201009",
    "201010",
    "201011",
    "201012",
    "201013",
    "201014",
    "201015",
    "201016",
    "201017",
  ],
  Agra: [
    "282001",
    "282002",
    "282003",
    "282004",
    "282005",
    "282006",
    "282007",
    "282008",
    "282009",
    "282010",
  ],
  Varanasi: [
    "221001",
    "221002",
    "221003",
    "221004",
    "221005",
    "221006",
    "221007",
    "221008",
    "221009",
    "221010",
    "221011",
  ],
  // Telangana
  Hyderabad: [
    "500001",
    "500002",
    "500003",
    "500004",
    "500005",
    "500006",
    "500007",
    "500008",
    "500009",
    "500010",
    "500011",
    "500012",
    "500013",
    "500014",
    "500015",
    "500016",
    "500017",
    "500018",
    "500019",
    "500020",
    "500022",
    "500023",
    "500024",
    "500025",
    "500026",
    "500027",
    "500028",
    "500029",
    "500030",
    "500031",
    "500032",
    "500033",
    "500034",
    "500035",
    "500036",
    "500037",
    "500038",
    "500039",
    "500040",
    "500041",
    "500042",
    "500043",
    "500044",
    "500045",
    "500046",
    "500047",
    "500048",
    "500049",
    "500050",
    "500051",
    "500052",
    "500053",
    "500054",
    "500055",
    "500056",
    "500057",
    "500058",
    "500059",
    "500060",
    "500061",
    "500062",
    "500063",
    "500064",
    "500065",
    "500066",
    "500067",
    "500068",
    "500069",
    "500070",
    "500071",
    "500072",
    "500073",
    "500074",
    "500075",
    "500076",
    "500077",
    "500078",
    "500079",
    "500080",
    "500081",
    "500082",
    "500083",
    "500084",
    "500085",
    "500086",
    "500087",
    "500088",
    "500089",
    "500090",
    "500091",
    "500092",
    "500093",
    "500094",
    "500095",
    "500096",
    "500097",
  ],
  Warangal: [
    "506001",
    "506002",
    "506003",
    "506004",
    "506005",
    "506006",
    "506007",
    "506008",
    "506009",
    "506010",
    "506011",
    "506012",
    "506013",
    "506014",
    "506015",
  ],
  Nizamabad: ["503001", "503002", "503003"],
  Karimnagar: [
    "505001",
    "505002",
    "505003",
    "505004",
    "505005",
    "505122",
    "505129",
    "505152",
    "505153",
    "505162",
    "505172",
    "505174",
    "505182",
    "505184",
    "505185",
    "505186",
    "505187",
    "505188",
    "505189",
    "505208",
    "505209",
    "505210",
    "505211",
    "505212",
    "505213",
    "505214",
    "505215",
    "505301",
    "505302",
    "505303",
    "505304",
    "505305",
    "505306",
    "505307",
    "505325",
    "505326",
    "505327",
    "505330",
    "505331",
    "505401",
    "505402",
    "505403",
    "505404",
    "505405",
    "505415",
    "505416",
    "505417",
    "505425",
    "505445",
    "505446",
    "505450",
    "505451",
    "505452",
    "505453",
    "505454",
    "505455",
    "505460",
    "505461",
    "505462",
    "505463",
    "505464",
    "505465",
    "505466",
    "505467",
    "505468",
    "505469",
    "505470",
    "505471",
    "505472",
    "505473",
    "505474",
    "505475",
    "505476",
    "505480",
    "505481",
    "505490",
    "505491",
    "505492",
    "505497",
    "505498",
    "505501",
    "505502",
    "505503",
    "505504",
    "505505",
    "505524",
    "505525",
    "505526",
    "505527",
    "505528",
    "505529",
    "505530",
  ],
  Khammam: [
    "507001",
    "507002",
    "507003",
    "507101",
    "507102",
    "507103",
    "507111",
    "507112",
    "507113",
    "507114",
    "507115",
    "507116",
    "507117",
    "507118",
    "507119",
    "507120",
    "507121",
    "507122",
    "507123",
    "507124",
    "507125",
    "507126",
    "507127",
    "507128",
    "507129",
    "507130",
    "507131",
    "507132",
    "507133",
    "507134",
    "507135",
    "507136",
    "507137",
    "507138",
    "507139",
    "507140",
    "507141",
    "507142",
    "507154",
    "507155",
    "507156",
    "507157",
    "507158",
    "507159",
    "507160",
    "507161",
    "507162",
    "507163",
    "507164",
    "507165",
    "507166",
    "507167",
    "507168",
    "507169",
    "507170",
    "507201",
    "507202",
    "507203",
    "507204",
    "507205",
    "507206",
    "507207",
    "507208",
    "507209",
    "507210",
    "507211",
    "507212",
    "507213",
    "507301",
    "507302",
    "507303",
    "507304",
    "507305",
    "507306",
    "507316",
    "507317",
    "507318",
  ],
  // Kerala
  Thiruvananthapuram: [
    "695001",
    "695002",
    "695003",
    "695004",
    "695005",
    "695006",
    "695007",
    "695008",
    "695009",
    "695010",
    "695011",
    "695012",
    "695013",
    "695014",
    "695015",
    "695016",
    "695017",
    "695018",
    "695019",
    "695020",
    "695021",
    "695022",
    "695023",
    "695024",
    "695025",
    "695026",
    "695027",
    "695028",
    "695029",
    "695030",
    "695031",
    "695032",
    "695033",
    "695034",
    "695035",
    "695036",
    "695037",
    "695038",
    "695039",
    "695040",
    "695041",
    "695042",
    "695043",
  ],
  Kochi: [
    "682001",
    "682002",
    "682003",
    "682004",
    "682005",
    "682006",
    "682007",
    "682008",
    "682009",
    "682010",
    "682011",
    "682012",
    "682013",
    "682014",
    "682015",
    "682016",
    "682017",
    "682018",
    "682019",
    "682020",
    "682021",
    "682022",
    "682023",
    "682024",
    "682025",
    "682026",
    "682027",
    "682028",
    "682029",
    "682030",
  ],
  Kozhikode: [
    "673001",
    "673002",
    "673003",
    "673004",
    "673005",
    "673006",
    "673007",
    "673008",
    "673009",
    "673010",
    "673011",
    "673012",
    "673013",
    "673014",
    "673015",
    "673016",
    "673017",
    "673018",
    "673019",
    "673020",
    "673021",
    "673022",
    "673023",
    "673024",
    "673025",
    "673026",
    "673027",
  ],
  Thrissur: [
    "680001",
    "680002",
    "680003",
    "680004",
    "680005",
    "680006",
    "680007",
    "680008",
    "680009",
    "680010",
    "680011",
    "680012",
    "680013",
    "680014",
    "680015",
    "680020",
    "680021",
    "680022",
    "680023",
    "680024",
    "680025",
    "680026",
    "680027",
    "680028",
  ],
  Kollam: [
    "691001",
    "691002",
    "691003",
    "691004",
    "691005",
    "691006",
    "691007",
    "691008",
    "691009",
    "691010",
    "691011",
    "691012",
    "691013",
    "691014",
    "691015",
    "691016",
    "691017",
    "691018",
    "691019",
    "691020",
  ],
};

/**
 * Get a valid pincode for a given city
 * @param city - The city name
 * @returns A valid pincode for that city
 */
const getValidPincodeForCity = (city: string): string => {
  const pincodes = VALID_PINCODES_BY_CITY[city];
  if (pincodes && pincodes.length > 0) {
    return pincodes[Math.floor(Math.random() * pincodes.length)];
  }
  // Fallback to Mumbai if city not found
  return VALID_PINCODES_BY_CITY["Mumbai"][
    Math.floor(Math.random() * VALID_PINCODES_BY_CITY["Mumbai"].length)
  ];
};

/**
 * Cities by state for test data
 */
const CITIES_BY_STATE: Record<string, string[]> = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
  Karnataka: ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Salem",
    "Tiruchirappalli",
  ],
  Delhi: ["New Delhi", "South Delhi", "North Delhi", "East Delhi"],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
  ],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  "Uttar Pradesh": [
    "Lucknow",
    "Noida",
    "Ghaziabad",
    "Kanpur",
    "Varanasi",
    "Agra",
  ],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
};

/**
 * Street name templates for test data
 */
const STREET_TEMPLATES = [
  "MG Road",
  "Station Road",
  "Ring Road",
  "Industrial Area",
  "Commercial Complex",
  "IT Park",
  "Business District",
  "Trade Center",
  "Market Street",
  "Highway Service Road",
];

/**
 * Pickup location notes templates
 */
const PICKUP_LOCATION_NOTES = [
  "Main pickup location with extended operating hours",
  "Convenient location near public transport",
  "Large parking area available for customers",
  "Climate-controlled storage facility",
  "Express pickup service available",
  "Wheelchair accessible entrance",
  "Security monitored 24/7",
  "Self-service pickup kiosk available",
  "Staff assistance during business hours",
  "Adjacent to major shopping center",
];

/**
 * Pickup location request model for test data
 * Note: shipRocketPickupLocationId is assigned by the backend PickupLocationService
 */
export interface PickupLocationTestData {
  addressNickName: string;
  address: {
    streetAddress: string;
    streetAddress2?: string;
    streetAddress3?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: string;
    nameOnAddress?: string;
    emailOnAddress?: string;
    phoneOnAddress?: string;
  };
  notes?: string;
}

/**
 * Generate test data for a single pickup location form
 * Creates a pickup location with randomly generated test data
 *
 * @param preserveName - Optional existing name to preserve (for edit mode)
 * @returns PickupLocationTestData for form population
 */
export const generatePickupLocationFormTest = (
  preserveName?: string
): PickupLocationTestData => {
  const template =
    PICKUP_LOCATION_TEMPLATES[
      Math.floor(Math.random() * PICKUP_LOCATION_TEMPLATES.length)
    ];
  const timestamp = Date.now();

  // Random state and city
  const state = INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)];
  const stateCities = CITIES_BY_STATE[state] || ["Mumbai"];
  const city = stateCities[Math.floor(Math.random() * stateCities.length)];

  // Random street
  const street =
    STREET_TEMPLATES[Math.floor(Math.random() * STREET_TEMPLATES.length)];
  const buildingNumber = 1 + Math.floor(Math.random() * 500);

  // Get valid postal code for the selected city
  const postalCode = getValidPincodeForCity(city);

  // Random phone (10 digits starting with 9 or 8)
  const phonePrefix = Math.random() > 0.5 ? "98" : "88";
  const phoneRemaining = Math.floor(10000000 + Math.random() * 90000000);
  const phone = `${phonePrefix}${phoneRemaining}`;

  // Random email
  const emailDomain = ["gmail.com", "yahoo.com", "outlook.com", "company.com"][
    Math.floor(Math.random() * 4)
  ];
  const emailPrefix = `pickup_${timestamp % 100000}`;

  // Random notes
  const notes =
    PICKUP_LOCATION_NOTES[
      Math.floor(Math.random() * PICKUP_LOCATION_NOTES.length)
    ];

  // Address type (HOME or WORK to match form validation)
  const addressType = Math.random() < 0.5 ? "HOME" : "WORK";

  // Optional floor/building info (70% chance)
  const hasFloor = Math.random() > 0.3;
  const hasBuilding = Math.random() > 0.3;

  // Shiprocket API limits pickup_location to 36 characters max
  // Generate a short unique name that fits within the limit
  // Use timestamp + random to ensure uniqueness on rapid clicks
  const uniqueId = `${timestamp % 10000}${Math.floor(Math.random() * 1000)}`;
  let generatedName = `${template.name} ${uniqueId}`;
  // Truncate to 36 characters if needed
  if (generatedName.length > 36) {
    generatedName = `${template.name.substring(0, 20)} ${uniqueId}`;
  }

  return {
    addressNickName: preserveName ?? generatedName,
    address: {
      streetAddress: `${buildingNumber}, ${street}`,
      streetAddress2: hasFloor
        ? `Floor ${1 + Math.floor(Math.random() * 10)}`
        : "",
      streetAddress3: hasBuilding
        ? `Building ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`
        : "",
      city,
      state,
      postalCode,
      country: "India",
      addressType,
      nameOnAddress: `${template.name} Manager`,
      emailOnAddress: `${emailPrefix}@${emailDomain}`,
      phoneOnAddress: phone,
    },
    notes,
  };
};

// ============================================================================
// Purchase Order Test Data Generation
// ============================================================================

/**
 * Purchase order status options matching PurchaseOrder.Status enum in backend
 */
const PURCHASE_ORDER_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "APPROVED_WITH_PARTIAL_PAYMENT",
  "REJECTED",
  "SENT_TO_VENDOR",
  "ACKNOWLEDGED",
  "IN_PRODUCTION",
  "SHIPPED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "COMPLETED",
  "CANCELLED",
  "ON_HOLD",
] as const;

/**
 * Priority options matching database constraints
 */
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

/**
 * Vendor templates for test data generation
 */
interface VendorTemplate {
  prefix: string;
  description: string;
  termsConditions: string;
  notes: string;
}

/**
 * Comprehensive rich text terms and conditions template for testing all formatting options
 * This includes all possible rich text editor features: headers, lists, colors, alignment, tables, etc.
 */
const COMPREHENSIVE_TERMS_CONDITIONS_HTML = `
  <h1 style="color: #1976d2; text-align: center;">PURCHASE ORDER TERMS & CONDITIONS</h1>

  <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px;">1. Payment Terms</h2>
  <p style="text-align: left;">
    Payment is due within <strong>30 days</strong> of invoice date.
    <em>Late payments</em> may incur a <u>2% monthly interest charge</u>.
    Payments can be made via <span style="color: #2e7d32; font-weight: bold;">bank transfer</span>,
    <span style="color: #ed6c02; font-weight: bold;">credit card</span>, or
    <span style="color: #9c27b0; font-weight: bold;">check</span>.
  </p>

  <h3 style="color: #0288d1; margin-top: 20px;">1.1 Payment Methods</h3>
  <ul style="list-style-type: disc; padding-left: 30px;">
    <li><strong>Bank Transfer:</strong> Account details provided upon order confirmation</li>
    <li><strong>Credit Card:</strong> Accepted with 2.5% processing fee</li>
    <li><strong>Check:</strong> Must be received before shipment</li>
    <li><strong>Net Terms:</strong> Available for orders above ₹50,000</li>
  </ul>

  <h3 style="color: #0288d1; margin-top: 20px;">1.2 Discounts</h3>
  <ol style="list-style-type: decimal; padding-left: 30px;">
    <li><span style="background-color: #fff9c4;">Early payment discount:</span> 2% if paid within 10 days</li>
    <li><span style="background-color: #c8e6c9;">Volume discount:</span> 5% for orders above ₹1,00,000</li>
    <li><span style="background-color: #ffccbc;">Bulk discount:</span> 10% for orders above ₹5,00,000</li>
  </ol>

  <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px; margin-top: 30px;">2. Delivery & Shipping</h2>
  <p style="text-align: justify; line-height: 1.8;">
    All orders will be shipped within <strong>5-7 business days</strong> of order confirmation.
    Delivery times vary based on location: <em>Metro cities (3-5 days)</em>,
    <em>Tier 2 cities (5-7 days)</em>, <em>Other locations (7-10 days)</em>.
  </p>

  <h3 style="color: #0288d1;">2.1 Shipping Charges</h3>
  <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
    <thead>
      <tr style="background-color: #1976d2; color: white;">
        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Order Value</th>
        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Shipping Charge</th>
        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Delivery Time</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background-color: #f5f5f5;">
        <td style="border: 1px solid #ddd; padding: 12px;">Below ₹5,000</td>
        <td style="border: 1px solid #ddd; padding: 12px;">₹150</td>
        <td style="border: 1px solid #ddd; padding: 12px;">5-7 days</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px;">₹5,000 - ₹25,000</td>
        <td style="border: 1px solid #ddd; padding: 12px;">₹100</td>
        <td style="border: 1px solid #ddd; padding: 12px;">4-6 days</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="border: 1px solid #ddd; padding: 12px;">Above ₹25,000</td>
        <td style="border: 1px solid #ddd; padding: 12px; color: #2e7d32; font-weight: bold;">FREE</td>
        <td style="border: 1px solid #ddd; padding: 12px;">3-5 days</td>
      </tr>
    </tbody>
  </table>

  <h3 style="color: #0288d1;">2.2 Delivery Options</h3>
  <ul style="list-style-type: square; padding-left: 30px;">
    <li><strong>Standard Delivery:</strong> 5-7 business days</li>
    <li><strong>Express Delivery:</strong> 2-3 business days (additional ₹500)</li>
    <li><strong>Same Day Delivery:</strong> Available in metro cities (additional ₹1,000)</li>
  </ul>

  <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px; margin-top: 30px;">3. Returns & Refunds</h2>
  <blockquote style="border-left: 4px solid #1976d2; padding-left: 20px; margin: 20px 0; font-style: italic; color: #555;">
    "Customer satisfaction is our top priority. We accept returns within 15 days of delivery
    for unused products in original packaging."
  </blockquote>

  <h3 style="color: #0288d1;">3.1 Return Policy</h3>
  <ul style="list-style-type: circle; padding-left: 30px;">
    <li>Returns accepted within <strong>15 days</strong> of delivery</li>
    <li>Products must be <em>unused</em> and in <em>original packaging</em></li>
    <li>Return shipping charges apply unless product is defective</li>
    <li>Refunds processed within <u>7-10 business days</u> after inspection</li>
  </ul>

  <h3 style="color: #0288d1;">3.2 Non-Returnable Items</h3>
  <p>The following items are <span style="color: #d32f2f; font-weight: bold;">NOT eligible</span> for return:</p>
  <ul style="list-style-type: disc; padding-left: 30px;">
    <li>Customized or personalized products</li>
    <li>Perishable goods</li>
    <li>Software licenses (once activated)</li>
    <li>Items damaged by customer misuse</li>
  </ul>

  <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px; margin-top: 30px;">4. Warranty & Support</h2>
  <p style="text-align: center; background-color: #e3f2fd; padding: 15px; border-radius: 5px;">
    <strong style="font-size: 18px; color: #1976d2;">All products come with manufacturer warranty</strong>
  </p>

  <h3 style="color: #0288d1;">4.1 Warranty Period</h3>
  <ul style="list-style-type: decimal; padding-left: 30px;">
    <li><strong>Electronics:</strong> 1 year from date of purchase</li>
    <li><strong>Furniture:</strong> 2 years from date of purchase</li>
    <li><strong>Appliances:</strong> 1 year parts, 5 years compressor (for ACs/Refrigerators)</li>
    <li><strong>Software:</strong> As per license agreement</li>
  </ul>

  <h3 style="color: #0288d1;">4.2 Support Channels</h3>
  <p>Contact us through any of the following:</p>
  <ul style="list-style-type: none; padding-left: 0;">
    <li>📧 Email: <a href="mailto:support@vendor.com" style="color: #1976d2; text-decoration: underline;">support@vendor.com</a></li>
    <li>📞 Phone: <a href="tel:+919876543210" style="color: #1976d2; text-decoration: underline;">+91 98765 43210</a></li>
    <li>🌐 Website: <a href="https://www.vendor.com" target="_blank" style="color: #1976d2; text-decoration: underline;">www.vendor.com</a></li>
    <li>💬 Live Chat: Available Monday-Friday, 9 AM - 6 PM IST</li>
  </ul>

  <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px; margin-top: 30px;">5. Quality & Inspection</h2>
  <p style="text-align: right; font-size: 14px; color: #666;">
    All products undergo <strong>quality inspection</strong> before shipment
  </p>

  <h3 style="color: #0288d1;">5.1 Quality Standards</h3>
  <p>We ensure:</p>
  <ul style="list-style-type: disc; padding-left: 30px;">
    <li>All products meet <span style="background-color: #fff9c4;">industry standards</span></li>
    <li>Certification documents provided where applicable</li>
    <li>Batch testing for consumables</li>
    <li>ISO 9001:2015 certified processes</li>
  </ul>

  <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px; margin-top: 30px;">6. Pricing & Taxes</h2>
  <p>
    All prices are in <strong>Indian Rupees (₹)</strong> and are <em>exclusive of taxes</em>.
    Applicable <u>GST</u> will be added as per current tax rates:
  </p>

  <h3 style="color: #0288d1;">6.1 Tax Structure</h3>
  <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
    <thead>
      <tr style="background-color: #9c27b0; color: white;">
        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Product Category</th>
        <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">GST Rate</th>
        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px;">Electronics</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">18%</td>
        <td style="border: 1px solid #ddd; padding: 12px;">Standard rate</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="border: 1px solid #ddd; padding: 12px;">Office Supplies</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">12%</td>
        <td style="border: 1px solid #ddd; padding: 12px;">Reduced rate</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px;">Raw Materials</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">5%</td>
        <td style="border: 1px solid #ddd; padding: 12px;">Essential goods</td>
      </tr>
    </tbody>
  </table>

  <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px; margin-top: 30px;">7. Order Modifications & Cancellations</h2>
  <p>
    Orders can be <strong>modified</strong> within <span style="color: #ed6c02;">24 hours</span> of placement.
    Cancellations are accepted before shipment with <em>full refund</em>.
    After shipment, standard return policy applies.
  </p>

  <h3 style="color: #0288d1;">7.1 Modification Charges</h3>
  <ul style="list-style-type: disc; padding-left: 30px;">
    <li>No charge for modifications within 24 hours</li>
    <li>₹500 processing fee for modifications after 24 hours</li>
    <li>Price adjustments apply if order value changes</li>
  </ul>

  <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px; margin-top: 30px;">8. Force Majeure</h2>
  <p style="text-align: justify;">
    Neither party shall be liable for delays or failures in performance resulting from acts beyond
    reasonable control, including but not limited to: <strong>natural disasters</strong>,
    <strong>war</strong>, <strong>pandemics</strong>, <strong>government actions</strong>, or
    <strong>labor strikes</strong>.
  </p>

  <hr style="border: none; border-top: 2px solid #ddd; margin: 30px 0;" />

  <h2 style="color: #2e7d32; text-align: center; margin-top: 30px;">Additional Information</h2>

  <h4 style="color: #666;">Text Formatting Examples</h4>
  <p>
    This document demonstrates various text formatting options:
    <strong>Bold text</strong>,
    <em>Italic text</em>,
    <u>Underlined text</u>,
    <s>Strikethrough text</s>,
    <span style="color: #d32f2f;">Red colored text</span>,
    <span style="background-color: #fff9c4;">Highlighted text</span>,
    <code style="background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px;">inline code</code>,
    H<sub>2</sub>O (subscript),
    E=mc<sup>2</sup> (superscript),
    <span style="font-size: 24px;">Large text</span>,
    <span style="font-size: 12px;">Small text</span>.
  </p>

  <h4 style="color: #666;">Code Block Example</h4>
  <pre style="background-color: #263238; color: #aed581; padding: 15px; border-radius: 5px; overflow-x: auto;"><code>// Example code block
function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
}</code></pre>

  <h4 style="color: #666;">Nested Lists</h4>
  <ul style="padding-left: 30px;">
    <li>First level item
      <ul style="list-style-type: circle; padding-left: 25px;">
        <li>Second level item</li>
        <li>Another second level item
          <ol style="list-style-type: lower-alpha; padding-left: 25px;">
            <li>Third level item (alpha)</li>
            <li>Another third level item</li>
          </ol>
        </li>
      </ul>
    </li>
    <li>Another first level item</li>
  </ul>

  <h4 style="color: #666;">Text Alignment Examples</h4>
  <p style="text-align: left; background-color: #f5f5f5; padding: 10px;">Left aligned text</p>
  <p style="text-align: center; background-color: #e3f2fd; padding: 10px;">Center aligned text</p>
  <p style="text-align: right; background-color: #f3e5f5; padding: 10px;">Right aligned text</p>
  <p style="text-align: justify; background-color: #e8f5e9; padding: 10px;">
    Justified text spreads across the full width of the container, creating even spacing
    between words. This is useful for formal documents and improves readability in wide columns.
  </p>

  <hr style="border: none; border-top: 1px dashed #999; margin: 30px 0;" />

  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 40px;">
    <em>This is a comprehensive test document for rich text editor formatting capabilities.</em><br/>
    Last updated: <strong>2024</strong> | Version: <code>1.0</code>
  </p>
`;

/**
 * Pre-defined vendor templates for variety in test data
 */
const VENDOR_TEMPLATES: VendorTemplate[] = [
  {
    prefix: "TECH",
    description: "Technology equipment and accessories supplier",
    termsConditions: COMPREHENSIVE_TERMS_CONDITIONS_HTML,
    notes: "Preferred vendor for electronics and IT equipment",
  },
  {
    prefix: "OFFICE",
    description: "Office supplies and stationery provider",
    termsConditions: COMPREHENSIVE_TERMS_CONDITIONS_HTML,
    notes: "Regular supplier for office consumables",
  },
  {
    prefix: "RAW",
    description: "Raw materials and manufacturing supplies",
    termsConditions: COMPREHENSIVE_TERMS_CONDITIONS_HTML,
    notes: "Key supplier for production materials",
  },
  {
    prefix: "PKG",
    description: "Packaging materials and solutions",
    termsConditions: COMPREHENSIVE_TERMS_CONDITIONS_HTML,
    notes: "Packaging and shipping materials vendor",
  },
  {
    prefix: "MAINT",
    description: "Maintenance and facility supplies",
    termsConditions: COMPREHENSIVE_TERMS_CONDITIONS_HTML,
    notes: "Facility maintenance supplies vendor",
  },
  {
    prefix: "EQUIP",
    description: "Industrial equipment and machinery",
    termsConditions: COMPREHENSIVE_TERMS_CONDITIONS_HTML,
    notes: "Heavy equipment and machinery supplier",
  },
];

/**
 * Purchase order test data model
 */
export interface PurchaseOrderTestData {
  vendorNumber: string;
  expectedDeliveryDate: string;
  purchaseOrderStatus: string;
  priority: string;
  assignedLeadId: number;
  termsConditionsHtml: string;
  address: {
    streetAddress: string;
    streetAddress2?: string;
    streetAddress3?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: string;
    nameOnAddress?: string;
    emailOnAddress?: string;
    phoneOnAddress?: string;
  };
  deliveryFee: number;
  serviceFee: number;
  packagingFee: number;
  discount: number;
  notes: string;
}

/**
 * Generate test data for a single purchase order form
 * Creates a purchase order with randomly generated test data
 * Fetches a real lead ID from the database
 *
 * @param preserveVendorNumber - Optional existing vendor number to preserve (for edit mode)
 * @returns Promise<PurchaseOrderTestData> for form population
 */
export const generatePurchaseOrderFormTest = async (
  preserveVendorNumber?: string
): Promise<PurchaseOrderTestData> => {
  const template =
    VENDOR_TEMPLATES[Math.floor(Math.random() * VENDOR_TEMPLATES.length)];
  const timestamp = Date.now();

  // Random status (prefer DRAFT or PENDING_APPROVAL for new orders)
  const statusIndex =
    Math.random() > 0.7
      ? Math.floor(Math.random() * PURCHASE_ORDER_STATUSES.length)
      : Math.floor(Math.random() * 2); // 70% chance of DRAFT or PENDING_APPROVAL
  const status = PURCHASE_ORDER_STATUSES[statusIndex];

  // Random priority
  const priority =
    PRIORITY_OPTIONS[Math.floor(Math.random() * PRIORITY_OPTIONS.length)];

  // Generate expected delivery date (7-60 days from now)
  const daysInFuture = 7 + Math.floor(Math.random() * 53);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + daysInFuture);
  // Set time to noon (12:00:00) for consistent datetime
  deliveryDate.setHours(12, 0, 0, 0);
  const expectedDeliveryDate = deliveryDate.toISOString();

  // Fetch a lead ID from the database
  let assignedLeadId = 1; // Default fallback
  try {
    const response = await leadApi.getLeadsInBatches({
      start: 0,
      end: 10,
      pageSize: 10,
    });
    const leads = response.data || [];
    if (leads.length > 0) {
      // Randomly select a lead
      const randomLead = leads[Math.floor(Math.random() * leads.length)];
      assignedLeadId = (randomLead as { leadId: number }).leadId;
    }
  } catch (error) {
    console.warn("Failed to fetch leads for test data, using default:", error);
  }

  // Random state and city for address
  const state = INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)];
  const stateCities = CITIES_BY_STATE[state] || ["Mumbai"];
  const city = stateCities[Math.floor(Math.random() * stateCities.length)];

  // Random street
  const street =
    STREET_TEMPLATES[Math.floor(Math.random() * STREET_TEMPLATES.length)];
  const buildingNumber = 1 + Math.floor(Math.random() * 500);

  // Get valid postal code for the selected city
  const postalCode = getValidPincodeForCity(city);

  // Random phone (10 digits starting with 9 or 8)
  const phonePrefix = Math.random() > 0.5 ? "98" : "88";
  const phoneRemaining = Math.floor(10000000 + Math.random() * 90000000);
  const phone = `${phonePrefix}${phoneRemaining}`;

  // Random email
  const emailDomain = [
    "vendor.com",
    "suppliers.com",
    "business.com",
    "procurement.com",
  ][Math.floor(Math.random() * 4)];
  const emailPrefix = `po_contact_${timestamp % 100000}`;

  // Optional floor/building info (70% chance)
  const hasFloor = Math.random() > 0.3;
  const hasBuilding = Math.random() > 0.3;

  // Random fees
  const deliveryFee = Math.round((50 + Math.random() * 450) * 100) / 100; // ₹50-500
  const serviceFee = Math.round((300 + Math.random() * 100) * 100) / 100; // ₹300-400 (random with up to 2 decimal places)
  const packagingFee = Math.round((20 + Math.random() * 180) * 100) / 100; // ₹20-200
  const discount = Math.round((0 + Math.random() * 500) * 100) / 100; // ₹0-500

  return {
    vendorNumber:
      preserveVendorNumber ?? `${template.prefix}-${timestamp % 100000}`,
    expectedDeliveryDate,
    purchaseOrderStatus: status,
    priority,
    assignedLeadId,
    termsConditionsHtml: template.termsConditions.trim(),
    address: {
      streetAddress: `${buildingNumber}, ${street}`,
      streetAddress2: hasFloor
        ? `Floor ${1 + Math.floor(Math.random() * 10)}`
        : "",
      streetAddress3: hasBuilding
        ? `Building ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`
        : "",
      city,
      state,
      postalCode,
      country: "India",
      addressType: "OFFICE",
      nameOnAddress: `${
        template.description.split(" ")[0]
      } Procurement Manager`,
      emailOnAddress: `${emailPrefix}@${emailDomain}`,
      phoneOnAddress: phone,
    },
    deliveryFee,
    serviceFee,
    packagingFee,
    discount,
    notes: template.notes,
  };
};

// ============================================================================
// Purchase Order Import Test Data Generation
// ============================================================================

/**
 * Interface for product with available stock information
 */
export interface ProductWithStock {
  productId: number;
  totalAvailableStock: number; // Total stock across all pickup locations
  price: number; // Product price for realistic pricing
}

/**
 * Interface for purchase order import test data
 */
export interface PurchaseOrderImportTestData {
  // Order Information
  vendorNumber: string;
  purchaseOrderStatus: string;
  priority: string;
  assignedLeadId: string; // Stored as string for Excel
  expectedDeliveryDate: string;
  termsConditionsHtml: string;
  // Delivery Address
  addressType: string;
  streetAddress: string;
  streetAddress2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  nameOnAddress: string;
  phoneOnAddress: string;
  emailOnAddress: string;
  // Products
  products: string; // Format: "productId:quantity:pricePerUnit, productId:quantity:pricePerUnit"
  // Additional Fields
  notes: string;
  attachments: string; // Comma-separated URLs
}

/**
 * Generate test purchase order import data
 * Creates an array of purchase order objects with varied test data
 * Each purchase order has 10 products with realistic pricing
 *
 * @param numberOfRecords - Number of test purchase order records to generate
 * @param availableProductIds - Array of product IDs available in the system
 * @param availableLeadIds - Array of lead IDs available in the system
 * @returns Array of PurchaseOrderImportTestData objects for import
 */
export const generatePurchaseOrderImportTest = (
  numberOfRecords: number,
  availableProducts: ProductWithStock[],
  availableLeadIds: number[]
): PurchaseOrderImportTestData[] => {
  const purchaseOrders: PurchaseOrderImportTestData[] = [];
  const baseTimestamp = Date.now();

  // Use all available products (stock filtering is handled by caller)
  const productsWithStock = availableProducts;

  if (productsWithStock.length === 0) {
    throw new Error(
      "No products available. Please add some products first."
    );
  }

  // Track remaining stock for each product across all orders
  const remainingStock = new Map<number, number>();
  productsWithStock.forEach((p) => {
    remainingStock.set(p.productId, p.totalAvailableStock);
  });

  for (let i = 0; i < numberOfRecords; i++) {
    const template = VENDOR_TEMPLATES[i % VENDOR_TEMPLATES.length];
    const timestamp = baseTimestamp + i;

    // Status - use DRAFT for testing payment flows
    const status = "DRAFT";

    // Random priority
    const priority =
      PRIORITY_OPTIONS[Math.floor(Math.random() * PRIORITY_OPTIONS.length)];

    // Randomly assign a lead ID from available leads
    const assignedLeadId =
      availableLeadIds.length > 0
        ? availableLeadIds[
            Math.floor(Math.random() * availableLeadIds.length)
          ].toString()
        : "";

    // Random state and city for address
    const state =
      INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)];
    const stateCities = CITIES_BY_STATE[state] || ["Mumbai"];
    const city = stateCities[Math.floor(Math.random() * stateCities.length)];

    // Random street
    const street =
      STREET_TEMPLATES[Math.floor(Math.random() * STREET_TEMPLATES.length)];
    const buildingNumber = 1 + Math.floor(Math.random() * 500);

    // Get valid postal code for the selected city
    const postalCode = getValidPincodeForCity(city);

    // Random phone (10 digits starting with 9 or 8)
    const phonePrefix = Math.random() > 0.5 ? "98" : "88";
    const phoneRemaining = Math.floor(10000000 + Math.random() * 90000000);
    const phone = `${phonePrefix}${phoneRemaining}`;

    // Random email
    const emailDomain = [
      "vendor.com",
      "suppliers.com",
      "business.com",
      "procurement.com",
    ][Math.floor(Math.random() * 4)];
    const emailPrefix = `order_contact_${timestamp % 100000}`;

    // Optional floor info (70% chance)
    const hasFloor = Math.random() > 0.3;
    const streetAddress2 = hasFloor
      ? `Floor ${1 + Math.floor(Math.random() * 10)}`
      : "";

    // Generate expected delivery date (7-60 days from now)
    const daysInFuture = 7 + Math.floor(Math.random() * 53);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + daysInFuture);
    const expectedDeliveryDate = deliveryDate.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Generate products with quantities respecting available stock
    const productsArray: string[] = [];

    // Get products that still have remaining stock
    const availableForSelection = productsWithStock.filter(
      (p) => (remainingStock.get(p.productId) ?? 0) > 0
    );

    // Shuffle and select only 2 products (for smaller order totals for payment testing)
    const shuffledProducts = [...availableForSelection].sort(
      () => Math.random() - 0.5
    );
    const selectedProducts = shuffledProducts.slice(
      0,
      Math.min(2, shuffledProducts.length)
    );

    selectedProducts.forEach((product) => {
      const availableQty = remainingStock.get(product.productId) ?? 0;
      if (availableQty <= 0) return;

      // Use quantity of 1 for payment testing (smaller order totals)
      const quantity = 1;

      // Use price in 10,000-20,000 range for payment testing (keeps total under 50k for Razorpay limits)
      const pricePerUnit = 10000 + Math.floor(Math.random() * 10000);

      productsArray.push(`${product.productId}:${quantity}:${pricePerUnit}`);

      // Deduct from remaining stock
      remainingStock.set(product.productId, availableQty - quantity);
    });

    // Skip this order if no products could be selected
    if (productsArray.length === 0) {
      continue;
    }

    const products = productsArray.join(", ");

    // Random address type - use valid Address.AddressType enum values
    const addressTypeOptions = ["HOME", "WORK", "BILLING", "SHIPPING", "OFFICE", "WAREHOUSE"];
    const addressType = addressTypeOptions[Math.floor(Math.random() * addressTypeOptions.length)];

    // Generate 3-5 random attachment URLs using picsum.photos
    const numAttachments = 3 + Math.floor(Math.random() * 3); // 3-5 attachments
    const attachmentUrls: string[] = [];
    for (let j = 0; j < numAttachments; j++) {
      const uniqueSeed = `${timestamp}_attachment_${i}_${j}_${Math.floor(
        Math.random() * 100000
      )}`;
      attachmentUrls.push(`https://picsum.photos/seed/${uniqueSeed}/800/600`);
    }
    const attachments = attachmentUrls.join(", ");

    purchaseOrders.push({
      vendorNumber: `${template.prefix}-${timestamp % 100000}`,
      purchaseOrderStatus: status,
      priority,
      assignedLeadId,
      expectedDeliveryDate,
      termsConditionsHtml: template.termsConditions, // Use comprehensive terms from vendor template
      addressType,
      streetAddress: `${buildingNumber}, ${street}`,
      streetAddress2,
      city,
      state,
      postalCode,
      country: "India",
      nameOnAddress: `Contact Person ${i + 1}`,
      phoneOnAddress: phone,
      emailOnAddress: `${emailPrefix}@${emailDomain}`,
      products,
      notes: template.notes,
      attachments,
    });
  }

  return purchaseOrders;
};
