#!/usr/bin/env python3
"""Source of truth for the local San Antonio articles. Writes marketing/articles/*.json.

Every figure is from a primary source researched 2026-10-13 and cited on the page:
SABOR September 2026 market report; Zillow Home Value Index (typical values, August 2026);
Texas Comptroller (2025 tax-year rates, homestead exemptions); Bexar Appraisal District;
City of San Antonio HIP; TDHCA; TSAHC; VA; FHFA; Texas GLO/VLB; TDI; TREC; Texas SB 1968.
Never add a number here without a source. Run, then: python3 marketing/build_articles.py
"""
import json
import pathlib

OUT = pathlib.Path(__file__).resolve().parent / "articles"
OUT.mkdir(exist_ok=True)
D = "2026-10-13"

S_SABOR = {"name": "SABOR September 2026 market report", "url": "https://sabor.com/market-research-and-statistics/market-statistics/south-texas-market-report/"}
S_ZILLOW = {"name": "Zillow Home Value Index, August 2026", "url": "https://www.zillow.com/research/data/"}
S_COMP_EX = {"name": "Texas Comptroller: property tax exemptions", "url": "https://comptroller.texas.gov/taxes/property-tax/exemptions/"}
S_COMP_RATES = {"name": "Texas Comptroller: 2025 tax rates", "url": "https://comptroller.texas.gov/taxes/property-tax/rates/"}
S_BCAD = {"name": "Bexar Appraisal District", "url": "https://bcad.org/online-portal/"}
S_HIP = {"name": "City of San Antonio HIP", "url": "https://www.sa.gov/Directory/Departments/NHSD/Housing-Support/Homeowner-Support/HIP"}
S_TDHCA = {"name": "TDHCA homebuyer programs", "url": "https://welcomehome.tdhca.texas.gov/"}
S_TSAHC = {"name": "TSAHC down payment assistance", "url": "https://www.tsahc.org/homebuyers-renters/loans-and-down-payment-assistance/"}
S_VA_FEE = {"name": "VA funding fee", "url": "https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/"}
S_VA_LIM = {"name": "VA loan limits", "url": "https://www.va.gov/housing-assistance/home-loans/loan-limits/"}
S_FHFA = {"name": "FHFA 2026 conforming loan limits", "url": "https://www.fhfa.gov/news/news-release/fhfa-announces-conforming-loan-limit-values-for-2026"}
S_VLB = {"name": "Texas Veterans Land Board home loans", "url": "https://www.glo.texas.gov/veterans/home-loans"}
S_TREC_SDN = {"name": "TREC Seller's Disclosure Notice", "url": "https://www.trec.texas.gov/forms/sellers-disclosure-notice"}
S_SB1968 = {"name": "Texas SB 1968", "url": "https://capitol.texas.gov/tlodocs/89R/billtext/html/SB01968F.htm"}
S_NAR = {"name": "NAR settlement FAQs", "url": "https://www.nar.realtor/the-facts/nar-settlement-faqs"}
S_TDI_RATES = {"name": "Texas Department of Insurance, Oct 8, 2026", "url": "https://www.tdi.texas.gov/news/2026/tdi10082026.html"}
S_TDI_ROOF = {"name": "Texas Department of Insurance, Sept 29, 2026", "url": "https://www.tdi.texas.gov/news/2026/tdi09292026.html"}
S_TDI_TITLE = {"name": "TDI 2026 title insurance rates", "url": "https://www.tdi.texas.gov/title/titlerates2026.html"}

ZNOTE = "Typical home values are the Zillow Home Value Index for August 2026, not sale prices. A specific home can sell well above or below its area's typical value."

ARTICLES = [
    {
        "slug": "cheapest-places-to-buy-a-house-in-san-antonio-2026",
        "title": "The Cheapest Places to Buy a House in San Antonio Right Now (2026)",
        "seo_title": "Cheapest Places to Buy a House in San Antonio (2026) | Kanye Concierge 360",
        "description": "The most affordable San Antonio ZIP codes and suburbs in 2026, from under $150,000 to $350,000, with typical home values, what to check before you buy, and down payment help.",
        "keywords": ["cheapest places to buy a house in San Antonio", "cheap houses San Antonio", "affordable homes San Antonio TX", "houses under 200k San Antonio", "San Antonio homes under 300k", "most affordable neighborhoods San Antonio", "first time home buyer San Antonio"],
        "category": "Buyer Guide", "date": D, "read_min": 6,
        "hero": "img-buyers.png", "hero_alt": "Buying an affordable home in San Antonio",
        "intro": [
            "San Antonio is still one of the most affordable big cities in Texas. The typical home in the City of San Antonio is worth about <strong>$247,000</strong>, and prices have dipped over the past year.",
            "Here is where your money goes furthest right now, from under $150,000 to the $350,000 suburbs. Every number is listed so you can compare at a glance.",
        ],
        "sections": [
            {"h2": "Under $150,000: the lowest prices in the city",
             "items": ["78207 (Westside): about $109,500", "78225 (South Side): about $124,000", "78237 (Westside): about $127,400", "78211 (Southside): about $130,200", "78226 (Southwest): about $135,200", "78214 (South Side): about $137,400"],
             "after": ["Expect older homes in these ZIP codes. Many are solid, but budget for repairs and never skip the inspection."]},
            {"h2": "$150,000 to $250,000: more house, still affordable",
             "items": ["Kirby: about $171,900", "78221 (Southside): about $176,900", "78224 (Southside): about $200,100", "78239 (Northeast): about $212,600", "78233 (Northeast): about $230,000", "Converse: about $240,600", "Live Oak: about $242,900"]},
            {"h2": "$250,000 to $350,000: the suburbs",
             "items": ["Leon Valley: about $263,100", "Universal City: about $264,500", "Seguin: about $271,900", "Schertz: about $312,000", "Far West / Alamo Ranch (78253): about $321,200", "Cibolo: about $331,800"],
             "after": [ZNOTE]},
            {"h2": "Why buyers have more room to negotiate right now",
             "items": ["Metro median sale price (Sept 2026): $302,999, down about 2% from a year ago", "Average days on market: 88, up 11% from a year ago", "Months of inventory: 5.95", "Active listings: 17,155, up 4%", "Homes sold for: 92.4% of their original list price, on average"],
             "after": ["More homes for sale and longer days on market mean sellers are more willing to deal. That can mean a lower price, help with closing costs, or repairs paid by the seller."]},
            {"h2": "Before you buy a cheap house, check these",
             "items": ["Flood risk: read the seller's disclosure. The Texas form asks about the 100-year and 500-year floodplain and past flooding", "Inspection: always get one, especially on older homes", "Property taxes: roughly 2.27% to 2.44% of value a year inside San Antonio before exemptions, depending on the school district", "Homestead exemption: file it after you move in. It takes $140,000 off your home's value for school taxes", "Down payment help: the City of San Antonio's HIP 80 offers up to $30,000 on existing homes priced up to $260,000, if you qualify by income"]},
        ],
        "faq": [
            {"q": "What is the cheapest area to buy a house in San Antonio?", "a": "By typical home value in August 2026, ZIP code 78207 on the Westside is the lowest at about $109,500, followed by 78225 and 78237."},
            {"q": "How much is a typical house in San Antonio?", "a": "The typical home in the City of San Antonio was worth about $247,000 in August 2026 (Zillow Home Value Index). The metro median sale price was $302,999 in September 2026 (SABOR)."},
            {"q": "Can I get help with a down payment in San Antonio?", "a": "Yes, if you qualify. The City of San Antonio's HIP program, TDHCA's My First Texas Home and TSAHC's programs all offer down payment help with income and price limits. See our first-time buyer guide."},
        ],
        "sources": [S_ZILLOW, S_SABOR, S_TREC_SDN, S_COMP_RATES, S_COMP_EX, S_HIP],
        "cta_intent": "Buying",
        "related": ["first-time-home-buyer-san-antonio-down-payment-assistance-2026", "what-your-money-buys-in-san-antonio-2026", "san-antonio-property-taxes-2026-homestead-exemption"],
    },
    {
        "slug": "what-your-money-buys-in-san-antonio-2026",
        "title": "$250K, $450K or $1 Million: What Your Money Buys in San Antonio in 2026",
        "seo_title": "What $250K, $450K or $1M Buys in San Antonio (2026) | Kanye Concierge 360",
        "description": "Where every budget lands in San Antonio in 2026: the neighborhoods and suburbs at $250,000, $450,000 and $1 million, with typical values and yearly property taxes.",
        "keywords": ["San Antonio home prices 2026", "what can I afford in San Antonio", "San Antonio neighborhoods by price", "homes for sale San Antonio", "San Antonio luxury homes", "San Antonio real estate agent"],
        "category": "Buyer Guide", "date": D, "read_min": 6,
        "hero": "img-stone-oak.png", "hero_alt": "San Antonio homes at every price point",
        "intro": [
            "The same budget buys a very different life depending on where you land in Greater San Antonio. Here are the three budgets people ask about most, and exactly where each one fits.",
        ],
        "sections": [
            {"h2": "Around $250,000",
             "paras": ["This is right around the typical home value in the city itself. It buys an established home in much of San Antonio and several suburbs."],
             "items": ["Live Oak: about $242,900", "Converse: about $240,600", "Leon Valley: about $263,100", "Universal City: about $264,500", "Seguin: about $271,900"]},
            {"h2": "Around $450,000",
             "paras": ["This budget opens up the north side and the edge of the Hill Country, with newer homes and top-rated districts."],
             "items": ["Stone Oak: about $444,400", "78259 (North Central): about $402,400", "Castroville: about $425,600", "Helotes: about $466,300", "78258 (Stone Oak area): about $503,900", "78260 (Far North): about $517,700"]},
            {"h2": "$1 million and up",
             "paras": ["San Antonio's most established addresses sit right around this level."],
             "items": ["Hill Country Village: about $1,269,000", "The Dominion: about $1,072,600", "Shavano Park: about $926,600", "Terrell Hills: about $918,500", "Olmos Park: about $913,900", "Alamo Heights: about $733,600", "Boerne: about $557,400"],
             "after": ["Above $832,750, most buyers move from a conforming loan to a jumbo loan, which has different down payment and credit rules. Plan for it early.", ZNOTE]},
            {"h2": "What property taxes look like at each budget",
             "paras": ["Texas has no state income tax, so property taxes do the heavy lifting. Inside the City of San Antonio, combined 2025 rates run about:"],
             "items": ["Northside ISD area: about 2.29% of value a year", "North East ISD area: about 2.27%", "San Antonio ISD area: about 2.44%", "Boerne (Kendall County): about 1.86%", "New Braunfels in Comal ISD: about 1.79%"],
             "after": ["On a $250,000 home in Northside ISD, that's roughly $5,700 a year before exemptions. Your homestead exemption takes $140,000 off the value for school taxes, which lowers the bill."]},
        ],
        "faq": [
            {"q": "How much do I need to buy a house in San Antonio?", "a": "The metro median sale price was $302,999 in September 2026. Several San Antonio ZIP codes and suburbs have typical values under $250,000."},
            {"q": "What San Antonio neighborhoods cost about $1 million?", "a": "Hill Country Village, The Dominion, Shavano Park, Terrell Hills and Olmos Park all had typical home values around or above $900,000 in August 2026."},
            {"q": "What is the property tax rate in San Antonio?", "a": "Combined 2025 rates inside the city run roughly 2.27% to 2.44% of value a year before exemptions, depending on the school district."},
        ],
        "sources": [S_ZILLOW, S_SABOR, S_COMP_RATES, S_COMP_EX, S_FHFA],
        "cta_intent": "Buying",
        "related": ["cheapest-places-to-buy-a-house-in-san-antonio-2026", "million-dollar-neighborhoods-san-antonio-2026", "san-antonio-property-taxes-2026-homestead-exemption"],
    },
    {
        "slug": "first-time-home-buyer-san-antonio-down-payment-assistance-2026",
        "title": "First-Time Home Buyer in San Antonio? Here's the Down Payment Help Most People Miss (2026)",
        "seo_title": "San Antonio First-Time Home Buyer Down Payment Assistance (2026) | Kanye Concierge 360",
        "description": "Every major down payment assistance program for San Antonio buyers in 2026: City of San Antonio HIP, TDHCA My First Texas Home, TSAHC Homes for Texas Heroes, with amounts and limits.",
        "keywords": ["San Antonio down payment assistance", "first time home buyer San Antonio", "HIP program San Antonio", "My First Texas Home", "Homes for Texas Heroes", "first time home buyer programs Texas 2026"],
        "category": "First-Time Buyers", "date": D, "read_min": 7,
        "hero": "img-buyers.png", "hero_alt": "First-time home buyer in San Antonio",
        "intro": [
            "The biggest thing stopping most first-time buyers isn't the monthly payment. It's the down payment. San Antonio buyers have real help available, and most people never ask for it.",
            "Here's every major program, broken down so you can see in a minute which ones fit you.",
        ],
        "sections": [
            {"h2": "City of San Antonio: HIP 80",
             "items": ["Help: $1,000 to $30,000", "How it works: a 0% second loan with no monthly payment that is fully forgiven over time (5 years up to $15,000; 10 years above that)", "Income limit (2026): $56,350 for 1 person, up to $106,300 for a household of 8", "Max price: $260,000 for an existing home, $284,000 for new construction", "Must: buy inside San Antonio city limits, take an 8-hour HUD homebuyer class, put down at least $500 earnest money"]},
            {"h2": "City of San Antonio: HIP 120",
             "items": ["Help: $1,000 to $15,000", "How it works: 75% is forgiven over 10 years; 25% is repaid", "Income limit: $84,500 for 1 person, up to $159,350 for 8", "Max price: $301,700 for an existing home, $332,800 for new construction"],
             "after": ["City funding can run out during the year. Ask early whether HIP money is available before you write an offer."]},
            {"h2": "TDHCA: My First Texas Home",
             "items": ["Help: 2% to 5% of your loan, as a deferred second lien", "Who: first-time buyers (veterans and buyers in targeted areas can be exempt from the first-time rule)", "Income limit (San Antonio area): $104,725 for 1–2 people, $120,434 for 3 or more", "Max price: $583,580, or $713,265 in targeted areas"]},
            {"h2": "TDHCA: My Choice Texas Home",
             "items": ["Who: you don't have to be a first-time buyer", "Income limit (San Antonio area): $172,720"]},
            {"h2": "TSAHC: Homes for Texas Heroes and Home Sweet Texas",
             "items": ["Help: up to 5% of your loan, as a grant or a second lien", "Homes for Texas Heroes: teachers, police, fire and EMS, corrections officers, veterans and active military, and nursing faculty", "Home Sweet Texas: for low- and moderate-income buyers"]},
            {"h2": "How to use this without getting burned",
             "items": ["Step 1: get pre-approved with a lender that offers these programs (not every lender does)", "Step 2: ask the lender which program gives you the lowest total cost, not just the biggest check", "Step 3: take the homebuyer class early if your program requires it", "Step 4: pick an agent who has closed with assistance programs; the timelines are tighter"]},
        ],
        "faq": [
            {"q": "How much down payment assistance can I get in San Antonio?", "a": "The City of San Antonio's HIP 80 offers $1,000 to $30,000 for eligible buyers on homes up to $260,000 (existing). TDHCA and TSAHC programs offer up to 5% of the loan amount."},
            {"q": "Do I have to be a first-time buyer?", "a": "Not for every program. TDHCA's My Choice Texas Home doesn't require it, and veterans can be exempt from the first-time rule in My First Texas Home."},
            {"q": "Is HIP money available right now?", "a": "It depends on the city's funding at the time. Ask the City of San Antonio or a participating lender before you write an offer."},
        ],
        "sources": [S_HIP, S_TDHCA, S_TSAHC],
        "cta_intent": "Buying",
        "related": ["cheapest-places-to-buy-a-house-in-san-antonio-2026", "va-loan-military-home-buyers-san-antonio-2026", "san-antonio-property-taxes-2026-homestead-exemption"],
    },
    {
        "slug": "san-antonio-property-taxes-2026-homestead-exemption",
        "title": "San Antonio Property Taxes in 2026: The $140,000 Exemption and What You'll Really Pay",
        "seo_title": "San Antonio Property Taxes 2026 & the $140,000 Homestead Exemption | Kanye Concierge 360",
        "description": "Texas raised the school homestead exemption to $140,000 and the over-65 exemption by $60,000. Here are San Antonio's tax rates by school district and how to file with Bexar Appraisal District.",
        "keywords": ["San Antonio property taxes", "Bexar County property tax rate", "Texas homestead exemption 140000", "how to file homestead exemption Bexar County", "over 65 property tax exemption Texas", "Northside ISD tax rate"],
        "category": "Homeowner Guide", "date": D, "read_min": 6,
        "hero": "img-alamo-heights.png", "hero_alt": "San Antonio homes and property taxes",
        "intro": [
            "Property taxes are the biggest ongoing cost of owning a home in Texas. Texas voters approved two big changes in November 2025 that cut the school portion of the bill for homeowners.",
        ],
        "sections": [
            {"h2": "What changed",
             "items": ["School homestead exemption: raised from $100,000 to $140,000", "Over-65 or disabled: an extra $60,000 school exemption, up from $10,000", "When: both apply starting with the 2025 tax year", "Approved: by Texas voters on November 4, 2025"]},
            {"h2": "San Antonio tax rates by school district",
             "paras": ["Combined 2025 rates inside the City of San Antonio (city, Bexar County, University Health, Alamo Colleges, river authority and school district), before exemptions:"],
             "items": ["North East ISD: about 2.27%", "Northside ISD: about 2.29%", "San Antonio ISD: about 2.44%"],
             "after": ["School district rates alone (2025): Alamo Heights ISD 0.9572%, North East ISD 0.9822%, Judson ISD 0.9796%, Northside ISD 1.0049%, San Antonio ISD 1.1552%, Medina Valley ISD 1.1527%, Southwest ISD 1.1598%, Harlandale ISD 1.2575%. Some areas add an emergency services or other special district. 2026 rates are being adopted this fall."]},
            {"h2": "Outside Bexar County",
             "items": ["Boerne (Kendall County, Boerne ISD): about 1.86% combined", "New Braunfels in Comal ISD: about 1.79% combined, before any special district", "Schertz-Cibolo-Universal City ISD: 1.0769% school rate"]},
            {"h2": "What the new exemption saves, in real numbers",
             "paras": ["Take a $300,000 home in Northside ISD:"],
             "items": ["Old: $200,000 taxable for school taxes × 1.0049% = about $2,010", "New: $160,000 taxable × 1.0049% = about $1,608", "Savings on the school portion: about $400 a year"]},
            {"h2": "How to file your homestead exemption in Bexar County",
             "items": ["Form: Residence Homestead Exemption Application (Form 50-114)", "Where: online at Bexar Appraisal District, or by mail", "Attach: a copy of your Texas driver's license or ID showing the home's address", "Deadline: April 30 of the tax year", "Late: you can still file up to 2 years after the deadline (5 years for disabled veterans)", "Bought after January 1: you can get it for the rest of the year if the previous owner didn't have one"]},
        ],
        "faq": [
            {"q": "What is the homestead exemption in Texas for 2026?", "a": "School districts must exempt $140,000 of a homestead's value. Homeowners 65 and older or disabled get an additional $60,000 school exemption."},
            {"q": "What is the property tax rate in San Antonio?", "a": "Combined 2025 rates inside the city run about 2.27% (North East ISD) to 2.44% (San Antonio ISD) before exemptions."},
            {"q": "When is the deadline to file a homestead exemption in Bexar County?", "a": "April 30 of the tax year. Late applications are accepted up to 2 years after the deadline, or 5 years for disabled veterans."},
        ],
        "sources": [S_COMP_EX, S_COMP_RATES, S_BCAD],
        "cta_intent": "Buying",
        "related": ["what-your-money-buys-in-san-antonio-2026", "first-time-home-buyer-san-antonio-down-payment-assistance-2026", "sell-your-house-san-antonio-2026"],
    },
    {
        "slug": "va-loan-military-home-buyers-san-antonio-2026",
        "title": "Military City Home Buying: VA Loans and Veteran Programs in San Antonio (2026)",
        "seo_title": "VA Loans & Military Home Buying in San Antonio, JBSA (2026) | Kanye Concierge 360",
        "description": "Stationed at Joint Base San Antonio or retiring here? VA loan basics for 2026, the funding fee, the Texas Veterans Land Board loan, and down payment help for heroes.",
        "keywords": ["VA loan San Antonio", "JBSA housing", "military home buying San Antonio", "Lackland homes for sale", "Fort Sam Houston homes", "Randolph AFB homes", "Texas Veterans Land Board home loan", "PCS San Antonio realtor"],
        "category": "Military & Veterans", "date": D, "read_min": 6,
        "hero": "img-texas-ranch-home.png", "hero_alt": "Military family buying a home in San Antonio",
        "intro": [
            "San Antonio is Military City USA. Whether you're PCSing to JBSA-Fort Sam Houston, JBSA-Lackland or JBSA-Randolph, or putting down roots after you separate, you have buying power most people don't.",
        ],
        "sections": [
            {"h2": "VA loan basics",
             "items": ["Down payment: none required by the VA (your lender still has to approve you)", "Loan limit: none for veterans with full entitlement", "Funding fee, first use: 2.15% with under 5% down, 1.5% with 5% down, 1.25% with 10% down", "Funding fee, later use with under 5% down: 3.3%", "No funding fee: if you receive VA disability compensation, or you're a Purple Heart recipient on active duty"]},
            {"h2": "Texas Veterans Land Board home loan",
             "items": ["Loan amount: up to $832,750", "Terms: fixed rate, 15 to 30 years", "Bonus: a lower rate for veterans with a 30% or higher disability rating", "Rules: be a Texas resident and live in the home within 60 days, for at least 3 years"]},
            {"h2": "Down payment and closing cost help",
             "items": ["TSAHC Homes for Texas Heroes: up to 5% of the loan for veterans and active military (also teachers, police, fire and EMS)", "TDHCA My First Texas Home: veterans can be exempt from the first-time buyer rule"]},
            {"h2": "What military buyers should check",
             "items": ["Commute: map the drive to your gate at rush hour before you fall in love with a house", "Resale or rent-out: if you could PCS again, buy where homes rent and resell easily", "Homestead exemption: file with Bexar Appraisal District after you move in; disabled veterans get 5 years to file late", "Flooding: read the seller's disclosure for floodplain and past flooding"]},
        ],
        "faq": [
            {"q": "Do I need a down payment for a VA loan in San Antonio?", "a": "The VA doesn't require one. Your lender still qualifies you on credit and income."},
            {"q": "What is the VA funding fee in 2026?", "a": "For first use with less than 5% down it's 2.15%. It's 1.5% with 5% down and 1.25% with 10% down. Veterans receiving VA disability compensation don't pay it."},
            {"q": "What is the Texas Veterans Land Board home loan?", "a": "A fixed-rate Texas loan for eligible veterans up to $832,750, with a lower rate for veterans with a 30% or higher disability rating."},
        ],
        "sources": [S_VA_FEE, S_VA_LIM, S_VLB, S_TSAHC, S_TDHCA, S_BCAD],
        "cta_intent": "Buying",
        "related": ["first-time-home-buyer-san-antonio-down-payment-assistance-2026", "cheapest-places-to-buy-a-house-in-san-antonio-2026", "san-antonio-property-taxes-2026-homestead-exemption"],
    },
    {
        "slug": "sell-your-house-san-antonio-2026",
        "title": "Selling Your House in San Antonio in 2026: What It's Worth, How Long It Takes, What Changed",
        "seo_title": "Sell My House in San Antonio (2026): Price, Timeline & New Rules | Kanye Concierge 360",
        "description": "San Antonio homes now average 88 days on market and sell for 92.4% of original list price. Here's how to price right, what the 2026 Texas rules mean for sellers, and what to disclose.",
        "keywords": ["sell my house San Antonio", "how to sell a house in San Antonio", "what is my home worth San Antonio", "San Antonio listing agent", "selling a home in Texas 2026", "Texas seller's disclosure"],
        "category": "Seller Guide", "date": D, "read_min": 7,
        "hero": "img-sellers.png", "hero_alt": "Selling a house in San Antonio",
        "intro": [
            "The San Antonio market has shifted. Homes take longer to sell than a year ago, and buyers have more choices. That doesn't mean you can't sell well. It means pricing and preparation matter more than they have in years.",
        ],
        "sections": [
            {"h2": "The market sellers are facing (September 2026)",
             "items": ["Median sale price: $302,999, down about 2% from a year ago", "Days on market: 88 on average, up 11%", "Months of inventory: 5.95", "Pending sales: down 16% from a year ago", "Price received: 92.4% of the original list price, on average"]},
            {"h2": "The 92.4% number is the whole story",
             "paras": ["On average, homes are selling for about 7.6% less than their first asking price. That gap is the distance between where a home starts and where it finishes. Starting at the right price is how you keep it small."],
             "items": ["$300,000 first asking price: a 7.6% gap is about $22,800", "$500,000: about $38,000", "$1,000,000: about $76,000"],
             "after": ["Those are illustrations of the September 2026 average, not a prediction for your home."]},
            {"h2": "What changed for Texas sellers in 2026",
             "items": ["Buyer agreements: since January 1, 2026, Texas law requires a written agreement before an agent shows a home or presents an offer", "Commissions: the agreement must say compensation is not set by law and is fully negotiable", "MLS: offers of buyer-agent pay are no longer posted on the MLS (NAR settlement, August 2024)", "Disclosure form: TREC's Seller's Disclosure Notice was updated effective May 28, 2026"]},
            {"h2": "What you have to disclose",
             "items": ["Flooding: whether the home is in a 100-year or 500-year floodplain, any past flooding, and flood insurance", "Known defects: roof, foundation, plumbing, electrical and more", "Tip: disclose honestly and early. Surprises found by a buyer's inspector are how deals fall apart"]},
            {"h2": "What helps a house sell in this market",
             "items": ["Price: set from recent nearby sales, not from what you need", "Repairs: fix the known problems before listing", "Photos: professional, bright, every room", "Roof and insurance: Texas insurers can no longer deny or drop a policy based only on roof or home age, which helps buyers of older homes", "Flexibility: easy showings in the first two weeks, when interest is highest"]},
        ],
        "faq": [
            {"q": "How long does it take to sell a house in San Antonio?", "a": "Homes averaged 88 days on market in September 2026, up 11% from a year earlier (SABOR)."},
            {"q": "What is my house worth in San Antonio?", "a": "It depends on recent sales of similar homes near you. The metro median sale price was $302,999 in September 2026. Ask for a free, no-obligation price opinion based on your actual neighborhood."},
            {"q": "Are real estate commissions set by law in Texas?", "a": "No. Since January 1, 2026, Texas buyer agreements must state that compensation is not set by law and is fully negotiable."},
        ],
        "sources": [S_SABOR, S_SB1968, S_NAR, S_TREC_SDN, S_TDI_ROOF],
        "cta_intent": "Selling",
        "related": ["san-antonio-housing-market-september-2026", "million-dollar-neighborhoods-san-antonio-2026", "article-12"],
    },
    {
        "slug": "million-dollar-neighborhoods-san-antonio-2026",
        "title": "San Antonio's Million-Dollar Neighborhoods: Where the Top of the Market Lives (2026)",
        "seo_title": "Million-Dollar Homes & Luxury Neighborhoods in San Antonio (2026) | Kanye Concierge 360",
        "description": "Hill Country Village, The Dominion, Shavano Park, Terrell Hills, Olmos Park and Alamo Heights: typical values, school districts and what to know before you buy or sell at the top of the San Antonio market.",
        "keywords": ["million dollar homes San Antonio", "luxury homes for sale San Antonio", "The Dominion San Antonio homes", "Alamo Heights homes for sale", "Olmos Park real estate", "Terrell Hills homes", "Shavano Park homes", "San Antonio luxury real estate agent"],
        "category": "Luxury", "date": D, "read_min": 6,
        "hero": "img-dominion.png", "hero_alt": "Luxury home in The Dominion, San Antonio",
        "intro": [
            "While the overall San Antonio market cooled a little this year, the city's top neighborhoods held their value, and several rose. Here's where the top of the market is, by the numbers.",
        ],
        "sections": [
            {"h2": "The top addresses, by typical home value",
             "items": ["Hill Country Village: about $1,269,000, up 2.1% in a year", "The Dominion: about $1,072,600, up 3.8%", "Shavano Park: about $926,600, up 1.0%", "Terrell Hills: about $918,500, up 3.7%", "Olmos Park: about $913,900, up 0.8%", "Alamo Heights: about $733,600, up 1.4%", "Boerne: about $557,400, roughly flat"],
             "after": ["For comparison, the San Antonio metro as a whole was down about 1.9% over the same year. " + ZNOTE]},
            {"h2": "Why the close-in neighborhoods hold up",
             "items": ["Alamo Heights, Olmos Park and Terrell Hills: Alamo Heights ISD, with a 0.9572% school tax rate, the lowest of the area districts we track", "The Dominion: gated, with estate lots on the far northwest side", "Hill Country Village and Shavano Park: small cities with larger lots, minutes from the north side"]},
            {"h2": "Buying at $1 million and up",
             "items": ["Loan: above $832,750 (the 2026 conforming limit), most buyers need a jumbo loan with stricter down payment and credit rules", "Taxes: on a $1 million home inside San Antonio, combined rates of about 2.2% to 2.3% mean roughly $22,000 or more a year before exemptions. Alamo Heights, Olmos Park and Terrell Hills are their own cities, so their rates differ", "Off-market: many top homes trade privately before they ever hit the MLS. Ask your agent who is quietly selling"]},
            {"h2": "Selling at the top of the market",
             "items": ["Pricing: there are fewer recent sales to compare at this level, so pricing takes judgment, not just a computer estimate", "Presentation: professional photos, video and staging are expected", "Patience: with metro homes averaging 88 days on market, a well-priced luxury home still beats an overpriced one every time"]},
        ],
        "faq": [
            {"q": "What are the most expensive neighborhoods in San Antonio?", "a": "By typical home value in August 2026: Hill Country Village (about $1.27 million), The Dominion (about $1.07 million), Shavano Park, Terrell Hills and Olmos Park (each about $910,000 to $930,000)."},
            {"q": "Are San Antonio luxury home values going up?", "a": "In the top neighborhoods, yes. The Dominion rose about 3.8% and Terrell Hills about 3.7% over the year to August 2026, while the overall metro dipped about 1.9%."},
            {"q": "Do I need a jumbo loan in San Antonio?", "a": "Usually if you borrow more than $832,750, the 2026 conforming loan limit."},
        ],
        "sources": [S_ZILLOW, S_COMP_RATES, S_FHFA, S_SABOR],
        "cta_intent": "Buying",
        "related": ["article-6", "what-your-money-buys-in-san-antonio-2026", "sell-your-house-san-antonio-2026"],
    },
    {
        "slug": "san-antonio-housing-market-september-2026",
        "title": "San Antonio Housing Market: The September 2026 Numbers, Explained",
        "seo_title": "San Antonio Housing Market Report, September 2026 | Kanye Concierge 360",
        "description": "San Antonio's September 2026 housing numbers: median price $302,999, 88 days on market, 5.95 months of inventory. What it means for buyers and sellers, in plain English.",
        "keywords": ["San Antonio housing market", "San Antonio housing market 2026", "San Antonio home prices", "is San Antonio a buyers market", "Bexar County home sales", "San Antonio real estate market report"],
        "category": "Market Report", "date": D, "read_min": 5,
        "hero": "img-journal-1.png", "hero_alt": "San Antonio housing market report",
        "intro": [
            "Every month we break down the San Antonio housing numbers so you don't have to dig through reports. Here's September 2026.",
        ],
        "sections": [
            {"h2": "The numbers (San Antonio metro, September 2026)",
             "items": ["Homes sold: 2,793, down about 1% from a year ago", "Median price: $302,999, down about 2%", "Average price: $363,341, down about 2%", "Days on market: 88, up 11%", "Months of inventory: 5.95", "Active listings: 17,155, up 4%", "New listings: 4,172, up 3%", "Pending sales: 2,091, down 16%", "Sold at: 92.4% of original list price", "Average rent: $1,831"]},
            {"h2": "Bexar County and Texas",
             "items": ["Bexar County single-family sales: 1,839, up 6%", "Bexar County median: $282,680, down 4.8%", "Bexar County months of inventory: 5.4", "Texas statewide median: $330,000, down 0.7%"]},
            {"h2": "What it means if you're buying",
             "items": ["More choice: inventory is up and homes sit longer", "More leverage: ask for closing-cost help or repairs", "Insurance: Texas homeowners insurance filings since July averaged a 4.3% decrease"]},
            {"h2": "What it means if you're selling",
             "items": ["Price right: homes that start too high are the ones that sit", "Watch pending sales: down 16%, so buyers are more careful", "Prepare: repairs, photos and easy showings win in a slower market"]},
        ],
        "faq": [
            {"q": "Is San Antonio a buyer's market right now?", "a": "Conditions lean toward buyers more than a year ago: 5.95 months of inventory, 88 days on market and homes selling for 92.4% of original list price in September 2026."},
            {"q": "What is the median home price in San Antonio?", "a": "$302,999 for the San Antonio metro in September 2026, according to SABOR."},
        ],
        "sources": [S_SABOR, S_TDI_RATES],
        "cta_intent": "Buying and selling",
        "related": ["sell-your-house-san-antonio-2026", "cheapest-places-to-buy-a-house-in-san-antonio-2026", "what-your-money-buys-in-san-antonio-2026"],
    },
]

for a in ARTICLES:
    (OUT / f"{a['slug']}.json").write_text(json.dumps(a, indent=2, ensure_ascii=False))
    print("wrote", a["slug"])
