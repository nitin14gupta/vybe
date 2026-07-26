from typing import Optional

# Tier thresholds are on non-cancelled events hosted — kept here as the one
# source of truth (was previously duplicated ad hoc in routes/users.py).
HOST_TIER_EMOJI = {
    "Legend": "👑",
    "Elite": "💎",
    "Established": "⭐",
    "Rising": "🛡️",
}


def host_tier_for_count(hosted_events_count: int) -> Optional[str]:
    if hosted_events_count >= 75:
        return "Legend"
    if hosted_events_count >= 25:
        return "Elite"
    if hosted_events_count >= 10:
        return "Established"
    if hosted_events_count >= 3:
        return "Rising"
    return None
