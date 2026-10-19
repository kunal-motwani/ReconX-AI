export interface GLMappingResult {
  glCode: string;
  glCodeName: string;
  confidence: number;
  status: 'SUGGESTED' | 'VERIFIED' | 'REVIEW_REQUIRED';
  reasoning: string;
}

export interface IGLMappingProvider {
  suggestGLCode(
    companyId: string,
    vendorName: string,
    description: string,
    amount: number,
    availableGLCodes: Array<{ id: string; code: string; name: string; category: string }>
  ): Promise<GLMappingResult>;
}
