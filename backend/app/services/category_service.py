import re
from typing import Tuple, Dict, List
from app.schemas.transaction import EXPENSE_CATEGORIES

class CategoryService:
    # Rule packs mapping keyword regexes to categories with confidence and reasoning
    RULES: Dict[str, List[str]] = {
        "Software & Subscriptions": [
            r"aws\b|amazon web services", r"github", r"gitlab", r"google cloud|gcp", r"digitalocean",
            r"vercel", r"heroku", r"slack", r"zoom", r"figma", r"notion", r"openai|chatgpt",
            r"anthropic|claude", r"adobe|creative cloud", r"jetbrains|intellij", r"atlassian|jira|confluence",
            r"dropbox", r"1password|lastpass", r"spotify", r"netflix", r"apple developer",
            r"microsoft 365|office 365|azure", r"datadog", r"sentry", r"twilio", r"sendgrid"
        ],
        "Office Supplies": [
            r"staples", r"office depot", r"office max", r"amazon basics", r"stationery",
            r"paper\b", r"printer ink|toner", r"desk organizer", r"notebook", r"pens|binders"
        ],
        "Travel & Transport": [
            r"uber\b", r"lyft", r"taxi\b|cab\b", r"delta air", r"united air", r"american airlines",
            r"southwest air", r"british airways", r"amtrak|train|railway", r"expedia", r"booking\.com",
            r"airbnb", r"hotel|marriott|hilton|hyatt", r"parking|meter", r"toll|transit", r"gas station|shell|chevron|exxon"
        ],
        "Meals & Entertainment": [
            r"starbucks", r"dunkin", r"peet\'s", r"coffee|cafe", r"doordash", r"uber eats",
            r"grubhub", r"restaurant|bistro|diner", r"pizza|burger", r"bakery", r"catering"
        ],
        "Professional Services": [
            r"legal|law firm|attorney", r"cpa|accountant|bookkeeping", r"consulting",
            r"stripe fee|processing fee", r"upwork", r"fiverr", r"notary"
        ],
        "Utilities & Internet": [
            r"comcast|xfinity", r"verizon", r"at&t|t-mobile", r"spectrum|charter",
            r"electric|power|edison", r"water utility", r"cloudflare"
        ],
        "Marketing & Advertising": [
            r"facebook ads|meta ads", r"google ads", r"linkedin ads", r"twitter ads|x ads",
            r"mailchimp", r"convertkit", r"hubspot", r"canva", r"adroll"
        ],
        "Hardware & Equipment": [
            r"apple store|apple\.com", r"dell\b", r"lenovo", r"best buy", r"b&h photo",
            r"micro center", r"newegg", r"logitech", r"monitor|laptop|keyboard|mouse"
        ],
        "Taxes & Fees": [
            r"irs\b|internal revenue", r"franchise tax", r"state tax", r"annual report fee",
            r"bank fee|wire fee|monthly maintenance fee", r"government fee"
        ]
    }

    @classmethod
    def suggest_category_rule_based(
        cls,
        merchant: str,
        notes: str = "",
        raw_text: str = ""
    ) -> Tuple[str, float, str]:
        """
        Rule-based classifier returning (category, confidence, reasoning).
        Confidence is 0.85-0.95 for exact keyword matches.
        """
        combined = f"{merchant} {notes} {raw_text}".lower()

        for category, patterns in cls.RULES.items():
            for pattern in patterns:
                if re.search(pattern, combined):
                    matched_kw = re.search(pattern, combined).group(0)
                    return (
                        category,
                        0.92,
                        f"Rule matched keyword '{matched_kw}' in merchant or document details."
                    )

        return (
            "Other",
            0.30,
            "No standard keyword match found. Flagged as 'Other' for user review."
        )

category_service = CategoryService()
