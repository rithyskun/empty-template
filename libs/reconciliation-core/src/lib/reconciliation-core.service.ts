import { Injectable } from '@nestjs/common';

export interface MatchRule {
  id: string;
  name: string;
  priority: number;
}

export interface MatchResult {
  matched: boolean;
  confidence: number;
  rulesApplied: string[];
}

export interface ExceptionItem {
  id: string;
  type: 'UNMATCHED' | 'PARTIAL_MATCH' | 'AMOUNT_MISMATCH' | 'DUPLICATE';
  sourceRef: string;
  targetRef?: string;
  amount: number;
  difference?: number;
}

@Injectable()
export class ReconciliationCoreService {}
