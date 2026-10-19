def score_amount(a: float | None, b: float | None, tolerance_pct: float = 1.0) -> float:
    if a is None or b is None:
        return 0.0
    if a == b:
        return 1.0
    
    max_val = max(abs(a), abs(b))
    if max_val == 0:
        return 1.0
        
    diff_pct = (abs(a - b) / max_val) * 100
    if diff_pct <= tolerance_pct:
        return 1.0 - (diff_pct / tolerance_pct)
        
    return 0.0
