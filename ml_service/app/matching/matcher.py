from difflib import SequenceMatcher
from app.schemas.transactions import NormalizedTransaction
from app.schemas.reconciliation import ReconciliationResult, ReconciliationStatus, MatchScoreBreakdown
from app.config import get_settings
from app.matching.amount_matcher import score_amount
from app.matching.vendor_matcher import score_vendor
from app.matching.date_matcher import score_date
from app.matching.reference_matcher import score_reference

class TransactionMatcher:
    def __init__(self):
        self.settings = get_settings()
        self.weights = self.settings.MATCHING_WEIGHTS
        self.date_tol = self.settings.DATE_TOLERANCE_DAYS
        self.amt_tol = self.settings.AMOUNT_TOLERANCE_PERCENT
        
    def calculate_match_score(self, a: NormalizedTransaction, b: NormalizedTransaction) -> ReconciliationResult:
        amt_score = score_amount(a.amount, b.amount, self.amt_tol)
        ven_score = score_vendor(a.vendor, b.vendor)
        dat_score = score_date(a.date, b.date, self.date_tol)
        ref_score = score_reference(a.reference, b.reference)
        
        desc_score = 0.0
        if a.description and b.description:
            desc_score = SequenceMatcher(None, str(a.description).lower(), str(b.description).lower()).ratio()
            
        total_score = (
            amt_score * self.weights.get("amount", 0.0) +
            ven_score * self.weights.get("vendor", 0.0) +
            dat_score * self.weights.get("date", 0.0) +
            ref_score * self.weights.get("reference", 0.0) +
            desc_score * self.weights.get("description", 0.0)
        )
        
        status = ReconciliationStatus.UNMATCHED
        if total_score >= 0.95:
            status = ReconciliationStatus.MATCHED
        elif total_score >= 0.70:
            status = ReconciliationStatus.PARTIAL_MATCH
        elif total_score >= 0.40:
            status = ReconciliationStatus.MISMATCH
            
        req_human = total_score < self.settings.RECONCILIATION_AUTO_MATCH_THRESHOLD
        
        reason = f"Overall score: {total_score:.2f}. "
        if total_score >= 0.95:
            reason += "Strong match across key fields."
        elif total_score >= 0.70:
            reason += "Partial match. Requires review."
        elif total_score >= 0.40:
            reason += "Mismatch. Likely different transactions."
        else:
            reason += "Unmatched."

        breakdown = MatchScoreBreakdown(
            amount=amt_score,
            vendor=ven_score,
            date=dat_score,
            reference=ref_score,
            description=desc_score
        )
        
        return ReconciliationResult(
            status=status,
            confidence=total_score,
            source_transaction_id=a.transaction_id,
            matched_transaction_id=b.transaction_id if total_score >= 0.40 else "",
            score_breakdown=breakdown,
            reason=reason,
            requires_human_review=req_human
        )
