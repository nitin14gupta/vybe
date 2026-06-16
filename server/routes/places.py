from fastapi import APIRouter

router = APIRouter(prefix="/places", tags=["places"])

CITIES = [
    # Metros
    {"name": "Mumbai", "state": "Maharashtra"},
    {"name": "Delhi", "state": "Delhi NCR"},
    {"name": "Bangalore", "state": "Karnataka"},
    {"name": "Hyderabad", "state": "Telangana"},
    {"name": "Chennai", "state": "Tamil Nadu"},
    {"name": "Kolkata", "state": "West Bengal"},
    {"name": "Pune", "state": "Maharashtra"},
    {"name": "Ahmedabad", "state": "Gujarat"},
    # Tier 2 — North
    {"name": "Jaipur", "state": "Rajasthan"},
    {"name": "Lucknow", "state": "Uttar Pradesh"},
    {"name": "Kanpur", "state": "Uttar Pradesh"},
    {"name": "Agra", "state": "Uttar Pradesh"},
    {"name": "Meerut", "state": "Uttar Pradesh"},
    {"name": "Varanasi", "state": "Uttar Pradesh"},
    {"name": "Prayagraj", "state": "Uttar Pradesh"},
    {"name": "Ghaziabad", "state": "Uttar Pradesh"},
    {"name": "Noida", "state": "Uttar Pradesh"},
    {"name": "Amritsar", "state": "Punjab"},
    {"name": "Ludhiana", "state": "Punjab"},
    {"name": "Chandigarh", "state": "Punjab"},
    {"name": "Jalandhar", "state": "Punjab"},
    {"name": "Gurgaon", "state": "Haryana"},
    {"name": "Faridabad", "state": "Haryana"},
    {"name": "Jodhpur", "state": "Rajasthan"},
    {"name": "Kota", "state": "Rajasthan"},
    {"name": "Udaipur", "state": "Rajasthan"},
    {"name": "Srinagar", "state": "Jammu & Kashmir"},
    {"name": "Jammu", "state": "Jammu & Kashmir"},
    {"name": "Dehradun", "state": "Uttarakhand"},
    # Tier 2 — West
    {"name": "Surat", "state": "Gujarat"},
    {"name": "Vadodara", "state": "Gujarat"},
    {"name": "Rajkot", "state": "Gujarat"},
    {"name": "Nashik", "state": "Maharashtra"},
    {"name": "Nagpur", "state": "Maharashtra"},
    {"name": "Aurangabad", "state": "Maharashtra"},
    {"name": "Thane", "state": "Maharashtra"},
    {"name": "Navi Mumbai", "state": "Maharashtra"},
    {"name": "Solapur", "state": "Maharashtra"},
    {"name": "Kolhapur", "state": "Maharashtra"},
    {"name": "Bhopal", "state": "Madhya Pradesh"},
    {"name": "Indore", "state": "Madhya Pradesh"},
    {"name": "Jabalpur", "state": "Madhya Pradesh"},
    {"name": "Gwalior", "state": "Madhya Pradesh"},
    {"name": "Raipur", "state": "Chhattisgarh"},
    # Tier 2 — South
    {"name": "Coimbatore", "state": "Tamil Nadu"},
    {"name": "Madurai", "state": "Tamil Nadu"},
    {"name": "Tiruchirappalli", "state": "Tamil Nadu"},
    {"name": "Salem", "state": "Tamil Nadu"},
    {"name": "Kochi", "state": "Kerala"},
    {"name": "Thiruvananthapuram", "state": "Kerala"},
    {"name": "Kozhikode", "state": "Kerala"},
    {"name": "Thrissur", "state": "Kerala"},
    {"name": "Mysuru", "state": "Karnataka"},
    {"name": "Mangaluru", "state": "Karnataka"},
    {"name": "Hubballi", "state": "Karnataka"},
    {"name": "Vijayawada", "state": "Andhra Pradesh"},
    {"name": "Visakhapatnam", "state": "Andhra Pradesh"},
    {"name": "Guntur", "state": "Andhra Pradesh"},
    {"name": "Warangal", "state": "Telangana"},
    # Tier 2 — East
    {"name": "Patna", "state": "Bihar"},
    {"name": "Guwahati", "state": "Assam"},
    {"name": "Bhubaneswar", "state": "Odisha"},
    {"name": "Cuttack", "state": "Odisha"},
    {"name": "Ranchi", "state": "Jharkhand"},
    {"name": "Dhanbad", "state": "Jharkhand"},
    {"name": "Jamshedpur", "state": "Jharkhand"},
    {"name": "Siliguri", "state": "West Bengal"},
    {"name": "Durgapur", "state": "West Bengal"},
    {"name": "Asansol", "state": "West Bengal"},
    {"name": "Raipur", "state": "Chhattisgarh"},
    # Others / Tech hubs
    {"name": "Gurugram", "state": "Haryana"},
    {"name": "Mohali", "state": "Punjab"},
    {"name": "Pimpri-Chinchwad", "state": "Maharashtra"},
    {"name": "Navi Mumbai", "state": "Maharashtra"},
    {"name": "Gandhinagar", "state": "Gujarat"},
    {"name": "Shimla", "state": "Himachal Pradesh"},
    {"name": "Pondicherry", "state": "Puducherry"},
    {"name": "Goa", "state": "Goa"},
]

# deduplicate by name while preserving order
_seen: set = set()
_unique: list = []
for city in CITIES:
    if city["name"] not in _seen:
        _seen.add(city["name"])
        _unique.append(city)
CITIES = _unique


INTERESTS = [
    {"name": "Music",        "emoji": "🎵"},
    {"name": "Travel",       "emoji": "✈️"},
    {"name": "Food",         "emoji": "🍕"},
    {"name": "Sports",       "emoji": "⚽"},
    {"name": "Art",          "emoji": "🎨"},
    {"name": "Movies",       "emoji": "🎬"},
    {"name": "Gaming",       "emoji": "🎮"},
    {"name": "Dance",        "emoji": "💃"},
    {"name": "Fitness",      "emoji": "🏋️"},
    {"name": "Comedy",       "emoji": "😂"},
    {"name": "Photography",  "emoji": "📸"},
    {"name": "Fashion",      "emoji": "👗"},
    {"name": "Tech",         "emoji": "💻"},
    {"name": "Books",        "emoji": "📚"},
    {"name": "Cooking",      "emoji": "🍳"},
    {"name": "Nightlife",    "emoji": "🌃"},
    {"name": "Hiking",       "emoji": "🥾"},
    {"name": "Yoga",         "emoji": "🧘"},
]


@router.get("/cities")
def get_cities():
    return {"cities": CITIES}


AVAILABLE_BADGES = [
    "🔥 Vybe Starter",
    "✨ Early Adopter",
    "🎙️ Voice Ready",
    "🌟 Main Character",
    "💯 Realest",
    "⚡ Social Spark",
    "🌙 Night Owl",
    "💃 Party Animal",
    "🎯 Goal Getter",
    "🧘 Chill Vibes",
    "✈️ Wanderer",
    "🎵 Music Head",
]


@router.get("/interests")
def get_interests():
    return {"interests": INTERESTS}


@router.get("/badges")
def get_badges():
    return {"badges": AVAILABLE_BADGES}
