export interface TimelineEvent {
  step: number;
  title: string;
  timestamp: string;
  description: string;
  actor: string;
}

export interface InvestigationPlan {
  anomalyId: string;
  title: string;
  findings: string;
  recommendation: string;
  evidence: Record<string, any>;
  timeline: TimelineEvent[];
}

export interface IInvestigationProvider {
  generateInvestigation(anomaly: any, relatedEntities: { transaction?: any; document?: any; counterparty?: any }): Promise<InvestigationPlan>;
}
