import { IGLMappingProvider, GLMappingResult } from '../interfaces/gl-mapping.interface';

export class MockGLMappingProvider implements IGLMappingProvider {
  async suggestGLCode(
    companyId: string,
    vendorName: string,
    description: string,
    amount: number,
    availableGLCodes: Array<{ id: string; code: string; name: string; category: string }>
  ): Promise<GLMappingResult> {
    const text = `${vendorName} ${description}`.toLowerCase();

    // Map keywords to standard GL codes
    let targetCode = '7000'; // Default Misc
    let confidence = 0.50;
    let reasoning = 'No explicit pattern matched; mapped to Miscellaneous default';
    let status: 'SUGGESTED' | 'VERIFIED' | 'REVIEW_REQUIRED' = 'REVIEW_REQUIRED';

    if (text.includes('aws') || text.includes('amazon') || text.includes('microsoft') || text.includes('azure') || text.includes('cloud') || text.includes('slack') || text.includes('github')) {
      targetCode = '6201'; // Cloud/Software Expenses
      confidence = 0.94;
      reasoning = 'Matched known Cloud and SaaS provider signatures';
      status = 'SUGGESTED';
    } else if (text.includes('office') || text.includes('depot') || text.includes('stationery') || text.includes('chair') || text.includes('desk')) {
      targetCode = '6100'; // Office Expenses
      confidence = 0.92;
      reasoning = 'Matched Office Supplies & Infrastructure procurement keywords';
      status = 'SUGGESTED';
    } else if (text.includes('uber') || text.includes('ola') || text.includes('air') || text.includes('flight') || text.includes('hotel') || text.includes('trip') || text.includes('transit')) {
      targetCode = '6300'; // Travel Expenses
      confidence = 0.96;
      reasoning = 'Matched corporate transit and travel vendor records';
      status = 'SUGGESTED';
    } else if (text.includes('consult') || text.includes('legal') || text.includes('audit') || text.includes('kpmg') || text.includes('deloitte')) {
      targetCode = '6400'; // Professional Services
      confidence = 0.89;
      reasoning = 'Identified legal, accounting or consulting service scope';
      status = 'SUGGESTED';
    } else if (text.includes('food') || text.includes('swiggy') || text.includes('zomato') || text.includes('meal') || text.includes('catering')) {
      targetCode = '6500'; // Meals & Entertainment
      confidence = 0.91;
      reasoning = 'Identified employee catering and dining expense pattern';
      status = 'SUGGESTED';
    }

    const matchedGL = availableGLCodes.find((g) => g.code === targetCode) || availableGLCodes[0];

    return {
      glCode: matchedGL ? matchedGL.code : targetCode,
      glCodeName: matchedGL ? matchedGL.name : 'General Expense',
      confidence,
      status,
      reasoning
    };
  }
}
