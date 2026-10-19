from thefuzz import fuzz
from app.normalization.transaction_normalizer import TransactionNormalizer

def score_vendor(a: str | None, b: str | None) -> float:
    if not a or not b:
        return 0.0
    norm_a = TransactionNormalizer.normalize_vendor(a)
    norm_b = TransactionNormalizer.normalize_vendor(b)
    
    if not norm_a or not norm_b:
        return 0.0
        
    if norm_a == norm_b:
        return 1.0
        
    return fuzz.token_set_ratio(norm_a, norm_b) / 100.0
