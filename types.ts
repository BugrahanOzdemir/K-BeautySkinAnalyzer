
export interface Concern {
  name: string;
  description: string;
}

export interface ProductSuggestion {
  type: string;
  reason: string;
}

export interface Recommendations {
  morningRoutine: string[];
  eveningRoutine: string[];
  productSuggestions: ProductSuggestion[];
}

export interface AnalysisResult {
  skinType: string;
  analysis: string;
  concerns: Concern[];
  recommendations: Recommendations;
}
