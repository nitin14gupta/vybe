from fastapi import APIRouter

router = APIRouter(prefix="/places", tags=["places"])

CITIES = [
    # Metros
    {"name": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777},
    {"name": "Delhi", "state": "Delhi NCR", "lat": 28.7041, "lng": 77.1025},
    {"name": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946},
    {"name": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867},
    {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707},
    {"name": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lng": 88.3639},
    {"name": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
    {"name": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lng": 72.5714},
    # Tier 2 — North
    {"name": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lng": 75.7873},
    {"name": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462},
    {"name": "Kanpur", "state": "Uttar Pradesh", "lat": 26.4499, "lng": 80.3319},
    {"name": "Agra", "state": "Uttar Pradesh", "lat": 27.1767, "lng": 78.0081},
    {"name": "Meerut", "state": "Uttar Pradesh", "lat": 28.9845, "lng": 77.7064},
    {"name": "Varanasi", "state": "Uttar Pradesh", "lat": 25.3176, "lng": 82.9739},
    {"name": "Prayagraj", "state": "Uttar Pradesh", "lat": 25.4358, "lng": 81.8463},
    {"name": "Ghaziabad", "state": "Uttar Pradesh", "lat": 28.6692, "lng": 77.4538},
    {"name": "Noida", "state": "Uttar Pradesh", "lat": 28.5355, "lng": 77.3910},
    {"name": "Amritsar", "state": "Punjab", "lat": 31.6340, "lng": 74.8723},
    {"name": "Ludhiana", "state": "Punjab", "lat": 30.9010, "lng": 75.8573},
    {"name": "Chandigarh", "state": "Punjab", "lat": 30.7333, "lng": 76.7794},
    {"name": "Jalandhar", "state": "Punjab", "lat": 31.3260, "lng": 75.5762},
    {"name": "Gurgaon", "state": "Haryana", "lat": 28.4595, "lng": 77.0266},
    {"name": "Faridabad", "state": "Haryana", "lat": 28.4089, "lng": 77.3178},
    {"name": "Jodhpur", "state": "Rajasthan", "lat": 26.2389, "lng": 73.0243},
    {"name": "Kota", "state": "Rajasthan", "lat": 25.2138, "lng": 75.8648},
    {"name": "Udaipur", "state": "Rajasthan", "lat": 24.5854, "lng": 73.7125},
    {"name": "Srinagar", "state": "Jammu & Kashmir", "lat": 34.0837, "lng": 74.7973},
    {"name": "Jammu", "state": "Jammu & Kashmir", "lat": 32.7266, "lng": 74.8570},
    {"name": "Dehradun", "state": "Uttarakhand", "lat": 30.3165, "lng": 78.0322},
    # Tier 2 — West
    {"name": "Surat", "state": "Gujarat", "lat": 21.1702, "lng": 72.8311},
    {"name": "Vadodara", "state": "Gujarat", "lat": 22.3072, "lng": 73.1812},
    {"name": "Rajkot", "state": "Gujarat", "lat": 22.3039, "lng": 70.8022},
    {"name": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lng": 73.7898},
    {"name": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lng": 79.0882},
    {"name": "Aurangabad", "state": "Maharashtra", "lat": 19.8762, "lng": 75.3433},
    {"name": "Thane", "state": "Maharashtra", "lat": 19.2183, "lng": 72.9781},
    {"name": "Navi Mumbai", "state": "Maharashtra", "lat": 19.0330, "lng": 73.0297},
    {"name": "Solapur", "state": "Maharashtra", "lat": 17.6599, "lng": 75.9064},
    {"name": "Kolhapur", "state": "Maharashtra", "lat": 16.7050, "lng": 74.2433},
    {"name": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2599, "lng": 77.4126},
    {"name": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lng": 75.8577},
    {"name": "Jabalpur", "state": "Madhya Pradesh", "lat": 23.1815, "lng": 79.9864},
    {"name": "Gwalior", "state": "Madhya Pradesh", "lat": 26.2183, "lng": 78.1828},
    {"name": "Raipur", "state": "Chhattisgarh", "lat": 21.2514, "lng": 81.6296},
    # Tier 2 — South
    {"name": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lng": 76.9558},
    {"name": "Madurai", "state": "Tamil Nadu", "lat": 9.9252, "lng": 78.1198},
    {"name": "Tiruchirappalli", "state": "Tamil Nadu", "lat": 10.7905, "lng": 78.7047},
    {"name": "Salem", "state": "Tamil Nadu", "lat": 11.6643, "lng": 78.1460},
    {"name": "Kochi", "state": "Kerala", "lat": 9.9312, "lng": 76.2673},
    {"name": "Thiruvananthapuram", "state": "Kerala", "lat": 8.5241, "lng": 76.9366},
    {"name": "Kozhikode", "state": "Kerala", "lat": 11.2588, "lng": 75.7804},
    {"name": "Thrissur", "state": "Kerala", "lat": 10.5276, "lng": 76.2144},
    {"name": "Mysuru", "state": "Karnataka", "lat": 12.2958, "lng": 76.6394},
    {"name": "Mangaluru", "state": "Karnataka", "lat": 12.9141, "lng": 74.8560},
    {"name": "Hubballi", "state": "Karnataka", "lat": 15.3647, "lng": 75.1240},
    {"name": "Vijayawada", "state": "Andhra Pradesh", "lat": 16.5062, "lng": 80.6480},
    {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lng": 83.2185},
    {"name": "Guntur", "state": "Andhra Pradesh", "lat": 16.3067, "lng": 80.4365},
    {"name": "Warangal", "state": "Telangana", "lat": 17.9689, "lng": 79.5941},
    # Tier 2 — East
    {"name": "Patna", "state": "Bihar", "lat": 25.5941, "lng": 85.1376},
    {"name": "Guwahati", "state": "Assam", "lat": 26.1445, "lng": 91.7362},
    {"name": "Bhubaneswar", "state": "Odisha", "lat": 20.2961, "lng": 85.8245},
    {"name": "Cuttack", "state": "Odisha", "lat": 20.4625, "lng": 85.8828},
    {"name": "Ranchi", "state": "Jharkhand", "lat": 23.3441, "lng": 85.3096},
    {"name": "Dhanbad", "state": "Jharkhand", "lat": 23.7957, "lng": 86.4304},
    {"name": "Jamshedpur", "state": "Jharkhand", "lat": 22.8046, "lng": 86.2029},
    {"name": "Siliguri", "state": "West Bengal", "lat": 26.7271, "lng": 88.3953},
    {"name": "Durgapur", "state": "West Bengal", "lat": 23.5204, "lng": 87.3119},
    {"name": "Asansol", "state": "West Bengal", "lat": 23.6739, "lng": 86.9524},
    # Others / Tech hubs
    {"name": "Gurugram", "state": "Haryana", "lat": 28.4595, "lng": 77.0266},
    {"name": "Mohali", "state": "Punjab", "lat": 30.7046, "lng": 76.7179},
    {"name": "Pimpri-Chinchwad", "state": "Maharashtra", "lat": 18.6298, "lng": 73.7997},
    {"name": "Gandhinagar", "state": "Gujarat", "lat": 23.2156, "lng": 72.6369},
    {"name": "Shimla", "state": "Himachal Pradesh", "lat": 31.1048, "lng": 77.1734},
    {"name": "Pondicherry", "state": "Puducherry", "lat": 11.9416, "lng": 79.8083},
    {"name": "Goa", "state": "Goa", "lat": 15.2993, "lng": 74.1240},
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
