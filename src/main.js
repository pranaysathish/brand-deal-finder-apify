// Apify SDK - toolkit for building Apify Actors
import { Actor } from 'apify';
// Crawlee - web scraping and browser automation library
import { CheerioCrawler, Dataset, createCheerioRouter } from 'crawlee';

// Keywords that indicate a partnership/sponsorship page
const PARTNERSHIP_KEYWORDS = [
    'partner', 'sponsor', 'collaboration', 'collaborate',
    'creator', 'influencer', 'ambassador', 'affiliate',
    'content creator', 'streamer', 'creator program'
];

// Keywords that indicate we're on a relevant page
const CONTENT_INDICATORS = [
    'apply', 'join', 'program', 'opportunity', 'partnership',
    'sponsorship', 'requirements', 'contact', 'email'
];

await Actor.init();

const input = await Actor.getInput() ?? {};
const {
    creatorNiche = 'gaming',
    location = 'Global',
    customKeywords = '',
    followerCount = 50000,
    platforms = ['Twitch', 'YouTube'],
    maxBrandsToDiscover = 50
} = input;

console.log('🚀 Starting INTELLIGENT Startup Sponsorship Finder...');
console.log(`📊 Niche: ${creatorNiche}, Location: ${location}, Followers: ${followerCount}`);
if (customKeywords) console.log(`🔑 Custom Keywords: ${customKeywords}`);
console.log(`🔍 Using Google Search + Smart Crawling (No Hardcoded URLs!)`);

// Track discovered brands to avoid duplicates
const discoveredBrands = new Set();

// Step 1: Use Google Search to discover brand websites
console.log(`\n🔎 Step 1: Discovering brands via Google Search...`);

// Build search term (niche + custom keywords + location)
const searchTerm = customKeywords
    ? `${customKeywords} ${creatorNiche}`
    : creatorNiche;

const locationSuffix = location !== 'Global' ? ` ${location}` : '';

const searchQueries = [
    `${searchTerm} brand sponsorships 2024 2025${locationSuffix}`,
    `${searchTerm} creator programs${locationSuffix}`,
    `${searchTerm} influencer partnerships${locationSuffix}`,
    `${searchTerm} paid brand partnership${locationSuffix}`,
    `paid ${searchTerm} sponsorship opportunities${locationSuffix}`,
    `new ${searchTerm} brand collaborations${locationSuffix}`
];

console.log(`   Queries: ${searchQueries.join(', ')}`);

let brandHomepages = [];

try {
    // CRITICAL FIX: queries must be newline-separated string, NOT array
    const queriesString = searchQueries.join('\n');

    console.log(`   🔍 Calling Google Search Actor with ${searchQueries.length} queries...`);

    // Map location to country code
    const locationCodeMap = {
        'Global': 'us',
        'USA': 'us',
        'UK': 'uk',
        'Canada': 'ca',
        'Australia': 'au',
        'India': 'in',
        'EU': 'de'
    };

    const googleResults = await Actor.call('apify/google-search-scraper', {
        queries: queriesString,  // Fixed: newline-separated string
        maxPagesPerQuery: 3,     // Increased for more results
        resultsPerPage: 10,
        mobileResults: false,
        countryCode: locationCodeMap[location] || 'us',
        languageCode: 'en',
    });

    if (!googleResults || !googleResults.defaultDatasetId) {
        throw new Error('Google Search Actor returned no dataset ID');
    }

    console.log(`   ✅ Google Search completed, opening dataset...`);
    const googleDataset = await Actor.openDataset(googleResults.defaultDatasetId);
    const { items } = await googleDataset.getData();

    if (!items || items.length === 0) {
        throw new Error('Google Search dataset is empty - no results found');
    }

    console.log(`   ✅ Google Search returned ${items.length} results`);

    // Extract unique domain homepages from organicResults
    const domains = new Set();
    let totalOrganic = 0;

    items.forEach(item => {
        // Each item has organicResults array
        if (item.organicResults && Array.isArray(item.organicResults)) {
            item.organicResults.forEach(result => {
                totalOrganic++;
                if (result.url && result.url.startsWith('http')) {
                    try {
                        const url = new URL(result.url);
                        // Skip Google domains
                        if (!url.hostname.includes('google.com')) {
                            const homepage = `${url.protocol}//${url.hostname}`;
                            domains.add(homepage);
                        }
                    } catch (e) {
                        // Skip invalid URLs
                    }
                }
            });
        }
    });

    console.log(`   ✅ Extracted ${totalOrganic} organic results, found ${domains.size} unique brand websites`);

    brandHomepages = Array.from(domains).slice(0, maxBrandsToDiscover);
    console.log(`   ✅ Will analyze ${brandHomepages.length} brand websites`);

    if (brandHomepages.length === 0) {
        throw new Error('No valid brand websites found in Google Search results');
    }

} catch (error) {
    console.error(`\n❌ CRITICAL ERROR: Google Search failed!`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack:`, error.stack);
    throw new Error(`Actor cannot run without Google Search. Error: ${error.message}. Please ensure you have sufficient Apify credits and Google Search Actor is accessible.`);
}

console.log(`\n🕷️ Step 2: Crawling ${brandHomepages.length} websites to find partnership pages...`);

// Create router for different page types
const router = createCheerioRouter();

// Route 1: Homepage - Find partnership links
router.addHandler('HOMEPAGE', async ({ request, $, enqueueLinks, log }) => {
    log.info(`🏠 Analyzing homepage: ${request.loadedUrl}`);

    const brandDomain = new URL(request.loadedUrl).hostname;
    const brandName = brandDomain.replace('www.', '').replace('.com', '').replace('.gg', '');

    // Find all links that might lead to partnership pages
    const partnershipLinks = [];

    $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();
        const title = $(elem).attr('title')?.toLowerCase() || '';

        if (!href) return;

        // Check if link text or title contains partnership keywords
        const isPartnershipLink = PARTNERSHIP_KEYWORDS.some(keyword =>
            text.includes(keyword) || title.includes(keyword)
        );

        if (isPartnershipLink) {
            // Convert relative URLs to absolute
            let fullUrl;
            try {
                fullUrl = new URL(href, request.loadedUrl).href;
            } catch (e) {
                return; // Skip invalid URLs
            }

            // Avoid duplicates and external links
            if (fullUrl.includes(brandDomain) && !partnershipLinks.includes(fullUrl)) {
                partnershipLinks.push(fullUrl);
                log.info(`   🔗 Found potential link: ${text.trim()} → ${fullUrl}`);
            }
        }
    });

    if (partnershipLinks.length === 0) {
        log.warning(`   ❌ No partnership links found on ${brandName} homepage`);
        return;
    }

    log.info(`   ✅ Found ${partnershipLinks.length} partnership links, following them...`);

    // Enqueue partnership pages
    await enqueueLinks({
        urls: partnershipLinks,
        label: 'PARTNERSHIP_PAGE',
        userData: { brandName, brandDomain }
    });
});

// Route 2: Partnership Page - Extract data
router.addHandler('PARTNERSHIP_PAGE', async ({ request, $, log }) => {
    const { brandName, brandDomain } = request.userData;
    log.info(`📄 Analyzing partnership page: ${request.loadedUrl}`);

    // Skip if we already processed this brand
    if (discoveredBrands.has(brandDomain)) {
        log.info(`   ⏭️ Already processed ${brandName}, skipping`);
        return;
    }

    const pageText = $('body').text().toLowerCase();

    // Verify this is actually a partnership page
    const hasRelevantContent = CONTENT_INDICATORS.some(keyword =>
        pageText.includes(keyword)
    );

    if (!hasRelevantContent) {
        log.info(`   ❌ Page doesn't contain partnership content, skipping`);
        return;
    }

    log.info(`   ✅ Valid partnership page found!`);

    // Extract page title
    const pageTitle = $('title').text() || $('h1').first().text() || 'Partnership Program';

    // Extract contact information (email, form, etc.)
    const emails = [];
    $('a[href^="mailto:"]').each((i, elem) => {
        const email = $(elem).attr('href')?.replace('mailto:', '');
        if (email && !emails.includes(email)) {
            emails.push(email);
        }
    });

    const applyLinks = [];
    $('a').each((i, elem) => {
        const text = $(elem).text().toLowerCase();
        const href = $(elem).attr('href');
        if ((text.includes('apply') || text.includes('join') || text.includes('get started')) && href) {
            try {
                const fullUrl = new URL(href, request.loadedUrl).href;
                applyLinks.push(fullUrl);
            } catch (e) { }
        }
    });

    const contactInfo = emails.length > 0
        ? emails[0]
        : (applyLinks.length > 0 ? applyLinks[0] : 'Apply via website');

    // Extract requirements
    const requirements = [];
    $('p, li, div').each((i, elem) => {
        const text = $(elem).text();
        if (text.length > 20 && text.length < 300 && (
            text.toLowerCase().includes('requirement') ||
            text.toLowerCase().includes('must have') ||
            text.toLowerCase().includes('follower') ||
            text.toLowerCase().includes('subscribe')
        )) {
            requirements.push(text.trim());
        }
    });

    // Determine sponsorship type
    let sponsorshipType = 'Partnership Program';
    if (pageText.includes('affiliate')) sponsorshipType = 'Affiliate Program';
    else if (pageText.includes('ambassador')) sponsorshipType = 'Brand Ambassador';
    else if (pageText.includes('paid') || pageText.includes('compensat')) sponsorshipType = 'Paid Sponsorship';
    else if (pageText.includes('product') || pageText.includes('free')) sponsorshipType = 'Product Sponsorship';

    // Extract rates (if mentioned)
    let estimatedRate = 'Contact for details';
    const ratePatterns = [
        /\$[\d,]+([-–]\$?[\d,]+)?/g,
        /[\d]+%\s*(commission|revenue share)/gi,
    ];
    for (const pattern of ratePatterns) {
        const matches = pageText.match(pattern);
        if (matches && matches.length > 0) {
            estimatedRate = matches[0];
            break;
        }
    }

    // Determine target niches
    const targetNiches = [];
    const nicheKeywords = {
        gaming: ['gaming', 'gamer', 'esports', 'streamer', 'twitch', 'youtube gaming'],
        tech: ['tech', 'technology', 'developer', 'software'],
        fitness: ['fitness', 'health', 'gym', 'workout'],
        beauty: ['beauty', 'makeup', 'cosmetic'],
        lifestyle: ['lifestyle', 'vlog'],
        pets: ['pet', 'dog', 'cat', 'animal', 'puppy'],
    };

    for (const [niche, keywords] of Object.entries(nicheKeywords)) {
        if (keywords.some(kw => pageText.includes(kw))) {
            targetNiches.push(niche);
        }
    }
    if (targetNiches.length === 0) targetNiches.push(creatorNiche);

    // Check if new (2024/2025 mentioned)
    const isNew = pageText.includes('2024') || pageText.includes('2025') ||
        pageText.includes('new program') || pageText.includes('launching');

    // Create opportunity object
    const opportunity = {
        brandName: isNew ? `${brandName} ⭐ NEW` : brandName,
        brandUrl: `https://${brandDomain}`,
        partnershipPageUrl: request.loadedUrl,
        partnershipPageTitle: pageTitle,
        targetNiches,
        sponsorshipType,
        estimatedRate,
        contactInfo,
        requirements: requirements.slice(0, 3).join(' | ') || 'Check website for requirements',
        discoveredVia: 'Intelligent Crawling',
        scrapedAt: new Date().toISOString()
    };

    log.info(`   💾 Saving: ${brandName}${isNew ? ' (NEW!)' : ''}`);

    discoveredBrands.add(brandDomain);
    await Dataset.pushData(opportunity);
});

// Default handler for unexpected pages
router.addDefaultHandler(async ({ request, log }) => {
    log.info(`⚠️ Unknown page type: ${request.loadedUrl}`);
});

// Create crawler
const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new CheerioCrawler({
    proxyConfiguration,
    requestHandler: router,
    maxRequestsPerCrawl: maxBrandsToDiscover * 5, // Allow crawling multiple pages per brand
    maxConcurrency: 5,
});

// Start crawling from brand homepages
const requests = brandHomepages.map(url => ({
    url,
    label: 'HOMEPAGE',
    userData: {}
}));

await crawler.run(requests);

// Final stats
const datasetInfo = await Dataset.getData();
const totalBrands = datasetInfo.items.length;
const newBrands = datasetInfo.items.filter(item => item.brandName.includes('⭐')).length;

console.log(`\n🎉 Discovery Complete!`);
console.log(`📊 Found ${totalBrands} partnership opportunities`);
console.log(`⭐ ${newBrands} new/emerging brands`);
console.log(`🔍 All discovered via INTELLIGENT crawling (no hardcoded URLs!)`);

await Actor.exit();
