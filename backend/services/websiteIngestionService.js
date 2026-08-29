const prisma = require('../lib/prisma');
const OpenAI = require('openai');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Website Ingestion Service
 * Handles URL scraping, content extraction, and AI analysis
 */
class WebsiteIngestionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.maxContentLength = 100000; // 100KB text limit
    this.timeout = 30000; // 30 second timeout
    this.supportedTypes = ['webpage', 'article', 'product', 'api', 'rss', 'sitemap'];
  }

  /**
   * Validate and sanitize URL
   */
  validateUrl(urlString) {
    try {
      const url = new URL(urlString);

      // Only allow http and https
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }

      // Block localhost and private IPs (basic SSRF protection)
      const hostname = url.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.') ||
        hostname.endsWith('.local')
      ) {
        throw new Error('Local and private network URLs are not allowed');
      }

      return url.toString();
    } catch (error) {
      if (error.code === 'ERR_INVALID_URL') {
        throw new Error('Invalid URL format');
      }
      throw error;
    }
  }

  /**
   * Scrape URL and extract content
   */
  async scrapeUrl(url, options = {}) {
    const {
      waitForSelector = null,
      screenshot = false,
      fullPage = false,
      extractType = 'auto',
    } = options;

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.timeout,
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }

      // Get page content
      const html = await page.content();
      const pageTitle = await page.title();
      const pageUrl = page.url();

      // Take screenshot if requested
      let screenshotBase64 = null;
      if (screenshot) {
        const screenshotBuffer = await page.screenshot({
          fullPage,
          type: 'jpeg',
          quality: 80,
        });
        screenshotBase64 = screenshotBuffer.toString('base64');
      }

      // Extract metadata
      const metadata = await page.evaluate(() => {
        const getMeta = (name) => {
          const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
          return el ? el.getAttribute('content') : null;
        };

        return {
          description: getMeta('description') || getMeta('og:description'),
          keywords: getMeta('keywords'),
          author: getMeta('author'),
          ogTitle: getMeta('og:title'),
          ogImage: getMeta('og:image'),
          ogType: getMeta('og:type'),
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          language: document.documentElement.lang,
        };
      });

      await browser.close();

      return {
        html,
        title: pageTitle,
        url: pageUrl,
        metadata,
        screenshot: screenshotBase64,
      };
    } catch (error) {
      if (browser) await browser.close();
      throw error;
    }
  }

  /**
   * Extract structured content from HTML
   */
  extractContent(html, extractType = 'auto') {
    const $ = cheerio.load(html);

    // Remove script and style tags
    $('script, style, noscript, iframe, nav, footer, header, aside').remove();

    // Extract main content
    const mainSelectors = ['article', 'main', '[role="main"]', '.content', '.post', '.article'];
    let mainContent = '';

    for (const selector of mainSelectors) {
      const $main = $(selector);
      if ($main.length > 0) {
        mainContent = $main.first().text().trim();
        break;
      }
    }

    if (!mainContent) {
      mainContent = $('body').text().trim();
    }

    // Clean up whitespace
    mainContent = mainContent.replace(/\s+/g, ' ').slice(0, this.maxContentLength);

    // Extract structured data
    const structuredData = {
      headings: [],
      links: [],
      images: [],
      tables: [],
      lists: [],
    };

    // Extract headings
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const $el = $(el);
      structuredData.headings.push({
        level: parseInt(el.tagName.slice(1)),
        text: $el.text().trim().slice(0, 200),
      });
    });

    // Extract links
    $('a[href]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        structuredData.links.push({
          text: $el.text().trim().slice(0, 100),
          href: href.slice(0, 500),
        });
      }
    });

    // Limit arrays
    structuredData.headings = structuredData.headings.slice(0, 50);
    structuredData.links = structuredData.links.slice(0, 100);

    // Extract images
    $('img[src]').each((_, el) => {
      const $el = $(el);
      structuredData.images.push({
        src: $el.attr('src'),
        alt: $el.attr('alt') || '',
        title: $el.attr('title') || '',
      });
    });
    structuredData.images = structuredData.images.slice(0, 50);

    return {
      text: mainContent,
      structured: structuredData,
    };
  }

  /**
   * Analyze content with AI
   */
  async analyzeContent(content, metadata, options = {}) {
    const { extractType = 'auto', customPrompt = null } = options;

    const typePrompts = {
      auto: 'Analyze this webpage content and extract key information.',
      article:
        'Extract the main article content, including title, author, publication date, and key points.',
      product:
        'Extract product information including name, price, description, specifications, and reviews.',
      contact: 'Extract contact information including names, emails, phone numbers, and addresses.',
      listing: 'Extract all items from this listing or catalog page.',
      form: 'Identify all form fields and their purposes on this page.',
    };

    const systemPrompt = customPrompt || typePrompts[extractType] || typePrompts.auto;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a web content analyzer. ${systemPrompt} Return structured JSON.`,
          },
          {
            role: 'user',
            content: `Analyze this webpage content:

Title: ${metadata.title || 'Unknown'}
URL: ${metadata.url || 'Unknown'}
Description: ${metadata.description || 'None'}

Content:
${content.text.slice(0, 8000)}

Headings:
${content.structured.headings
  .slice(0, 20)
  .map((h) => `${'#'.repeat(h.level)} ${h.text}`)
  .join('\n')}

Extract and return JSON:
\`\`\`json
{
  "summary": "2-3 sentence summary",
  "contentType": "article/product/listing/contact/other",
  "mainTopic": "primary topic",
  "keyPoints": ["key point 1", "key point 2"],
  "entities": {
    "people": [],
    "organizations": [],
    "locations": [],
    "dates": [],
    "prices": []
  },
  "sentiment": "positive/negative/neutral",
  "language": "detected language",
  "extractedData": {}
}
\`\`\``,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        summary: 'Content analysis failed',
        contentType: 'unknown',
        mainTopic: 'unknown',
        keyPoints: [],
        entities: {},
        error: error.message,
      };
    }
  }

  /**
   * Process URL and extract data
   */
  async processUrl(url, userId, options = {}) {
    const {
      name = null,
      description = null,
      extractType = 'auto',
      waitForSelector = null,
      screenshot = false,
      customPrompt = null,
      formId = null,
      organizationId = null,
    } = options;

    // Validate URL
    const validatedUrl = this.validateUrl(url);

    // Create data source record
    const dataSource = await prisma.dataSource.create({
      data: {
        type: 'WEBSITE',
        name: name || validatedUrl,
        description,
        status: 'PENDING',
        fileUrl: validatedUrl,
        metadata: {
          extractType,
          waitForSelector,
          screenshot,
          scrapedAt: new Date().toISOString(),
        },
        userId,
        organizationId,
        formId,
      },
    });

    try {
      // Update status to processing
      await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: { status: 'PROCESSING' },
      });

      const startTime = Date.now();

      // Scrape URL
      const scrapeResult = await this.scrapeUrl(validatedUrl, {
        waitForSelector,
        screenshot,
        extractType,
      });

      // Extract content
      const content = this.extractContent(scrapeResult.html, extractType);

      // Analyze with AI
      const analysis = await this.analyzeContent(
        content,
        {
          title: scrapeResult.title,
          url: scrapeResult.url,
          description: scrapeResult.metadata?.description,
        },
        { extractType, customPrompt },
      );

      const processingTime = Date.now() - startTime;

      // Update data source with results
      const updatedDataSource = await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          status: 'COMPLETED',
          extractedText: content.text.slice(0, 50000),
          extractedData: {
            url: scrapeResult.url,
            title: scrapeResult.title,
            metadata: scrapeResult.metadata,
            headings: content.structured.headings,
            links: content.structured.links.slice(0, 50),
            images: content.structured.images.slice(0, 20),
            analysis,
            screenshot: scrapeResult.screenshot
              ? `data:image/jpeg;base64,${scrapeResult.screenshot}`
              : null,
          },
          processingTime,
          aiModel: 'gpt-4-turbo-preview',
          confidence: this.calculateConfidence(content, analysis),
          processedAt: new Date(),
        },
      });

      return {
        id: updatedDataSource.id,
        status: 'COMPLETED',
        url: scrapeResult.url,
        title: scrapeResult.title,
        contentLength: content.text.length,
        analysis,
        processingTime,
        confidence: updatedDataSource.confidence,
      };
    } catch (error) {
      // Update status to failed
      await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Batch process multiple URLs
   */
  async processUrls(urls, userId, options = {}) {
    const results = [];

    for (const url of urls) {
      try {
        const result = await this.processUrl(url, userId, options);
        results.push({ url, success: true, data: result });
      } catch (error) {
        results.push({ url, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(content, analysis) {
    let confidence = 0.5;

    // Increase confidence based on content quality
    if (content.text.length > 500) confidence += 0.1;
    if (content.text.length > 2000) confidence += 0.1;
    if (content.structured.headings.length > 2) confidence += 0.1;

    // Increase confidence based on analysis quality
    if (analysis && !analysis.error) {
      confidence += 0.1;
      if (analysis.keyPoints?.length > 0) confidence += 0.05;
      if (
        analysis.entities &&
        Object.keys(analysis.entities).some((k) => analysis.entities[k]?.length > 0)
      ) {
        confidence += 0.05;
      }
    }

    return Math.min(Math.round(confidence * 100) / 100, 0.95);
  }

  /**
   * Get all website data sources for a user
   */
  async getUserWebsiteSources(userId, options = {}) {
    const { limit = 50, offset = 0, status } = options;

    const where = {
      userId,
      type: 'WEBSITE',
    };

    if (status) {
      where.status = status;
    }

    const [dataSources, total] = await Promise.all([
      prisma.dataSource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          fileUrl: true,
          extractedText: true,
          extractedData: true,
          processingTime: true,
          confidence: true,
          createdAt: true,
          processedAt: true,
          error: true,
        },
      }),
      prisma.dataSource.count({ where }),
    ]);

    return { dataSources, total, limit, offset };
  }

  /**
   * Get single website source by ID
   */
  async getWebsiteSource(id, userId) {
    const dataSource = await prisma.dataSource.findFirst({
      where: { id, userId, type: 'WEBSITE' },
      include: { analyses: true },
    });

    if (!dataSource) {
      throw new Error('Website source not found or access denied');
    }

    return dataSource;
  }

  /**
   * Delete website source
   */
  async deleteWebsiteSource(id, userId) {
    const dataSource = await prisma.dataSource.findFirst({
      where: { id, userId, type: 'WEBSITE' },
    });

    if (!dataSource) {
      throw new Error('Website source not found or access denied');
    }

    await prisma.dataSource.delete({ where: { id } });

    return { success: true };
  }

  /**
   * Re-scrape a URL
   */
  async rescrapeUrl(id, userId, options = {}) {
    const dataSource = await prisma.dataSource.findFirst({
      where: { id, userId, type: 'WEBSITE' },
    });

    if (!dataSource) {
      throw new Error('Website source not found or access denied');
    }

    // Process the URL again
    const result = await this.processUrl(dataSource.fileUrl, userId, {
      name: dataSource.name,
      description: dataSource.description,
      ...options,
    });

    // Delete the old record after successful rescrape
    await prisma.dataSource.delete({ where: { id } });

    return result;
  }
}

module.exports = new WebsiteIngestionService();
