# 🎯 Brand Deal Finder - AI-Powered Sponsorship Discovery for Creators

[![Apify](https://img.shields.io/badge/Apify-Actor-orange)](https://apify.com/pranayjsathish/brand-deal-finder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Automatically discover 30-50+ brand sponsorship opportunities tailored to your niche. Stop manually searching—let AI find the brands that want to work with creators like you.

## 🚀 Live Demo

**Try it now:** [https://apify.com/pranayjsathish/brand-deal-finder](https://apify.com/pranayjsathish/brand-deal-finder)

---

## ✨ Features

- **🤖 Intelligent Discovery**: Uses Google Search + smart web crawling to find brands actively seeking creators
- **🌍 Location-Based**: Filter by USA, UK, Canada, Australia, India, EU, or Global
- **🎯 Custom Keywords**: Refine searches (e.g., "cozy gaming", "vegan beauty", "dog toys")
- **📊 12 Niches Supported**: Gaming, Tech, Beauty, Fitness, Lifestyle, Pets, Food, Travel, Music, Education, Business, Fashion
- **💰 Extracts Deal Info**: Contact emails, application links, requirements, estimated rates
- **⚡ No Hardcoded Lists**: Finds new and emerging brands automatically

---

## 🎥 How It Works

1. **Enter Your Details**: Niche, location, follower count, custom keywords (optional)
2. **AI Searches**: Crawls Google to find 50+ brand websites
3. **Smart Analysis**: Visits each homepage and finds actual partnership pages
4. **Get Results**: Receive 30-50 brands with direct contact info and requirements

**Example Output:**
```json
{
  "brandName": "Razer ⭐ NEW",
  "partnershipPageUrl": "https://razer.com/creators",
  "sponsorshipType": "Paid Sponsorship",
  "estimatedRate": "$500-$2,000",
  "contactInfo": "creators@razer.com",
  "requirements": "10K+ followers, Gaming focus"
}
```

---

## 🛠️ Tech Stack

- **Platform**: [Apify](https://apify.com) (Serverless web scraping)
- **Language**: JavaScript (Node.js 22)
- **Framework**: [Crawlee](https://crawlee.dev) (Web crawling & scraping)
- **Search**: Google Search Scraper Actor (for brand discovery)
- **Architecture**: Intelligent router-based crawling (no hardcoded URLs)

---

## 📦 Installation & Local Development

### Prerequisites
- Node.js 20+
- Apify CLI: `npm install -g apify-cli`
- Apify Account (free tier works)

### Setup
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/brand-deal-finder.git
cd brand-deal-finder

# Install dependencies
npm install

# Login to Apify (required for Google Search)
apify login

# Run locally
apify run
```

### Input Example
```json
{
  "creatorNiche": "gaming",
  "location": "USA",
  "customKeywords": "cozy, indie",
  "followerCount": 50000,
  "platforms": ["Twitch", "YouTube"],
  "maxBrandsToDiscover": 50
}
```

---

## 🗂️ Project Structure

```
brand-deal-finder/
├── .actor/
│   ├── actor.json           # Actor metadata
│   ├── input_schema.json    # Input validation
│   ├── output_schema.json   # Output format
│   └── dataset_schema.json  # Data structure
├── src/
│   ├── main.js              # Core logic (Google Search + Crawling)
│   └── brandDatabase.js     # Fallback brand lists
├── Dockerfile               # Container config
├── package.json
└── README.md                # Apify Store README
```

---

## 🔧 How It Works (Technical)

### 1. **Google Search Discovery**
```javascript
// Generates location + keyword-aware search queries
const searchQueries = [
  `${customKeywords} ${niche} sponsorships 2024 2025 ${location}`,
  `paid ${niche} brand partnerships ${location}`,
  // ... 6 total queries
];

// Calls Google Search Actor
const results = await Actor.call('apify/google-search-scraper', {
  queries: queriesString,
  countryCode: locationCodeMap[location],
  maxPagesPerQuery: 3
});
```

### 2. **Intelligent Homepage Crawling**
```javascript
// Finds partnership links on homepages
const PARTNERSHIP_KEYWORDS = [
  'partner', 'sponsor', 'creator', 'influencer', 
  'ambassador', 'affiliate', 'collaboration'
];

// Follows links matching keywords
$('a').each((i, elem) => {
  const text = $(elem).text().toLowerCase();
  if (PARTNERSHIP_KEYWORDS.some(kw => text.includes(kw))) {
    enqueueLinks(fullUrl);
  }
});
```

### 3. **Data Extraction**
- **Contact Info**: Extracts emails (`mailto:`) and application links
- **Requirements**: Parses text for follower counts, platform requirements
- **Rates**: Detects `$` patterns and commission percentages
- **Sponsorship Type**: Classifies as Paid, Affiliate, Product, or Ambassador

---

## 🌟 Use Cases

- **Streamers**: Find gaming, tech, lifestyle sponsors
- **YouTubers**: Discover partnerships in any niche
- **Instagram Influencers**: Get beauty, fashion, fitness deals
- **TikTok Creators**: Locate trending brand collaborations
- **Agencies**: Research sponsor opportunities for clients

---

## 🚀 Deployment

### Deploy to Apify
```bash
# Build and deploy
apify push

# Your Actor will be live at:
# https://apify.com/YOUR_USERNAME/brand-deal-finder
```

### Make it Public
1. Go to Actor settings in Apify Console
2. Set visibility to **Public**
3. Add to Apify Store for monetization

---

## 📊 Example Results

**Input:** Gaming creator, USA, 50K followers  
**Output:** 42 brands found

| Brand | Type | Rate | Contact |
|-------|------|------|---------|
| GFUEL | Product Sponsorship | Contact for details | partnerships@gfuel.com |
| Razer | Paid Sponsorship | $500-$2K | Apply via link |
| Elgato | Brand Ambassador | Commission-based | creators@elgato.com |

---

## 🤝 Contributing

Contributions welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

MIT License - feel free to use for commercial projects!

---

## 🙏 Acknowledgments

- Built with [Apify](https://apify.com) - Serverless web scraping platform
- Powered by [Crawlee](https://crawlee.dev) - Web scraping framework
- Uses [Google Search Scraper](https://apify.com/apify/google-search-scraper)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/brand-deal-finder/issues)
- **Actor Page**: [Apify Console](https://apify.com/pranayjsathish/brand-deal-finder)
- **Email**: YOUR_EMAIL@example.com

---

## 🏆 Built For

Created for the **Apify $1M Challenge** - helping creators monetize their content more effectively.

---

**⭐ If this helped you find a sponsor, give it a star!**
