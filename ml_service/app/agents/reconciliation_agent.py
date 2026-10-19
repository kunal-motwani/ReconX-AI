from app.schemas.transactions import NormalizedTransaction
from app.schemas.reconciliation import ReconciliationBatchResult, ReconciliationResult, ReconciliationStatus
from app.matching.matcher import TransactionMatcher

class ReconciliationAgent:
    def __init__(self):
        self.matcher = TransactionMatcher()
        
    def reconcile(self, source_txns: list[NormalizedTransaction], target_txns: list[NormalizedTransaction]) -> ReconciliationBatchResult:
        result = ReconciliationBatchResult()
        result.total_source = len(source_txns)
        result.total_target = len(target_txns)
        
        available_targets = list(target_txns)
        
        for source in source_txns:
            best_match: ReconciliationResult | None = None
            best_target_idx = -1
            best_score = -1.0
            
            for idx, target in enumerate(available_targets):
                match_res = self.matcher.calculate_match_score(source, target)
                if match_res.confidence > best_score:
                    best_score = match_res.confidence
                    best_match = match_res
                    best_target_idx = idx
            
            if best_match and best_match.confidence >= 0.40:
                best_match.matched_transaction_id = available_targets[best_target_idx].transaction_id
                result.results.append(best_match)
                
                # Prevent double-matching
                available_targets.pop(best_target_idx)
                
                if best_match.status == ReconciliationStatus.MATCHED:
                    result.matched += 1
                elif best_match.status == ReconciliationStatus.PARTIAL_MATCH:
                    result.partial_matches += 1
                else:
                    result.mismatches += 1
                    
                if best_match.requires_human_review:
                    result.human_review_required += 1
            else:
                result.unmatched += 1
                result.results.append(ReconciliationResult(
                    status=ReconciliationStatus.UNMATCHED,
                    confidence=0.0,
                    source_transaction_id=source.transaction_id,
                    reason="No matching target found above mismatch threshold.",
                    requires_human_review=True
                ))
                result.human_review_required += 1
                
        return result
