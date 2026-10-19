from datetime import datetime
from dateutil import parser

def score_date(a: str | None, b: str | None, tolerance_days: int = 3) -> float:
    if not a or not b:
        return 0.0
        
    try:
        da = parser.parse(a).date()
        db = parser.parse(b).date()
        
        diff = abs((da - db).days)
        if diff == 0:
            return 1.0
        if diff <= tolerance_days:
            return 1.0 - (diff / (tolerance_days + 1))
            
        return 0.0
    except Exception:
        return 0.0
