export type ProductStatus =
  'pending-entry' | 'pending-confirmation' | 'analyzing' | 'completed' | 'failed';

export type ProductDetailTab = 'overview' | 'base' | 'audience' | 'selling-points';

export interface ProductBaseInfo {
  name: string;
  type: string;
  specPrice: string;
  origin: string;
  craft: string;
  rawMaterial: string;
  packaging: string;
  shipping: string;
  storage: string;
  afterSales: string;
  selectionStandard: string;
  founderTrace: string;
  recommendedCombo: string;
  tutorial: string;
  exclusiveFormula: string;
  knownSellingPoint: string;
  otherMaterials: string;
}

export interface ProductAudienceInsights {
  userStates: string[];
  concerns: string[];
  scenes: string[];
  selectionConcerns: string[];
  boundaries: string[];
}

export interface ProductSellingPoint {
  title: string;
  basedOn: string;
  whyItWorks: string;
  userHelp: string;
  buyingReason: string;
  boundary: string;
}

export interface ProductAnalysisResult {
  understanding: string;
  audienceSummary: string;
  coreSellingPoint: string;
  audience: ProductAudienceInsights;
  sellingPoints: ProductSellingPoint[];
}

export interface ProductRecord {
  id: string;
  base: ProductBaseInfo;
  status: ProductStatus;
  updatedAt: string;
  sourceDocumentIds: string[];
  analysis: ProductAnalysisResult | null;
  failureMessage?: string;
}
