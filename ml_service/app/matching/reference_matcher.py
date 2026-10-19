from thefuzz import fuzz
from app.normalization.transaction_normalizer import TransactionNormalizer

def score_reference(a: str | None, b: str | None) -> float:
    if not a or not b:
        return 0.0
        
    norm_a = TransactionNormalizer.normalize_reference(a)
    norm_b = TransactionNormalizer.normalize_reference(b)
    
    if not norm_a or not norm_b:
        return 0.0
        
    if norm_a == norm_b:
        return 1.0
        
    if norm_a in norm_b or norm_b in norm_a:
        return 0.8
        
    ratio = fuzz.ratio(norm_a, norm_b) / 100.0
    if ratio > 0.8:
        return ratio
        
    return 0.0
