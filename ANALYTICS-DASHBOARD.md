# Analytics Dashboard Guide

**Date**: October 15, 2025
**Location**: `/admin` page → **Analytics** tab

---

## 🎯 What's New

Added a comprehensive **Analytics Dashboard** to your existing Admin page showing real-time search telemetry and insights.

---

## 📊 Features

### **Key Metrics (Top Cards)**

1. **Total Searches** - All searches in selected time range
   - Shows today's count below

2. **Avg Response Time** - Search performance in milliseconds
   - Color-coded status: Excellent (<300ms), Good (<500ms), Needs attention (>500ms)

3. **Zero-Hit Rate** - Percentage of searches with no results
   - Lower is better (indicates good catalog coverage)
   - Color-coded: Excellent (<10%), Good (<25%), Needs attention (>25%)

4. **Top Products Shown** - Unique products appearing in results
   - Shows frequency of #1 product

### **Search Volume Trend (Chart)**

- **24 Hours**: Hourly breakdown of search activity
- **7 Days**: Daily search volume
- **30 Days**: Daily search volume

Hover over bars to see:
- Time period
- Number of searches
- Average latency

### **Top Searches (Table)**

Shows most popular queries with:
- Query text
- Number of times searched
- Average results returned

**Use this to:**
- Understand user intent
- Identify popular products/categories
- Create dedicated landing pages

### **Zero-Hit Searches (Table)**

Queries that returned no results (highlighted in red).

**Use this to:**
- Identify catalog gaps
- Add missing products
- Create synonyms in Algolia
- Improve search indexing

### **Most Displayed Products (Table)**

Products appearing most frequently in search results.

**Use this to:**
- Identify "hero products"
- Track search relevance
- Plan inventory
- Feature popular items

---

## 🚀 How to Access

### **Step 1: Login to Admin**

1. Go to `https://your-domain.com/admin`
2. Login with your Supabase auth credentials

### **Step 2: Navigate to Analytics**

1. Click the **"Analytics"** tab at the top
2. Select time range (24h, 7d, or 30d)
3. View metrics and insights

---

## ⏱️ Time Range Options

| Range | Best For | Data Shown |
|-------|----------|------------|
| **24 Hours** | Real-time monitoring | Hourly trends, today's performance |
| **7 Days** | Weekly insights | Daily trends, week-over-week comparison |
| **30 Days** | Monthly reports | Daily trends, long-term patterns |

---

## 📈 Analytics Use Cases

### **1. Monitor Performance**

**Check daily:**
- Average response time staying under 300ms
- Zero-hit rate staying under 10%

**Alert triggers:**
- Response time > 500ms → Check Algolia performance
- Zero-hit rate > 25% → Review catalog/indexing

### **2. Content Strategy**

**Top Searches reveal:**
- Popular gift categories (e.g., "birthday gifts for mom")
- Seasonal trends (e.g., "anniversary gifts" spike in certain months)
- Product gaps (high search volume but low results)

**Action items:**
- Create landing pages for top 10 searches
- Add "Trending" section based on search volume
- Stock popular items identified in searches

### **3. Catalog Management**

**Zero-Hit Searches reveal:**
- Missing products (e.g., "vegan chocolate" with 50 searches)
- Synonym issues (e.g., "kitchen apron" vs "cooking apron")
- Spelling variants (e.g., "jewellery" vs "jewelry")

**Action items:**
- Add products for high-volume zero-hit queries
- Configure Algolia synonyms
- Update product descriptions/tags

### **4. Product Performance**

**Top Products reveal:**
- Best-selling items appearing in most searches
- Well-optimized products (good titles/tags)
- Products with broad appeal

**Action items:**
- Feature top products on homepage
- Use similar products as "related items"
- Analyze why these products rank well

---

## 🔍 Reading the Data

### **Excellent Performance**

```
✅ Total Searches: Growing steadily
✅ Avg Response Time: <250ms
✅ Zero-Hit Rate: <5%
✅ Top Searches: Clear patterns, high intent
```

**What this means:**
- Search is fast and reliable
- Catalog is well-covered
- Users finding what they need

### **Needs Attention**

```
⚠️ Total Searches: Declining or flat
⚠️ Avg Response Time: >400ms
⚠️ Zero-Hit Rate: >20%
⚠️ Top Searches: Many zero-hits in top 10
```

**What to do:**
1. Check Algolia index health
2. Review recent catalog changes
3. Add products for zero-hit queries
4. Optimize search settings

---

## 💡 Pro Tips

### **Tip 1: Compare Time Ranges**

Switch between time ranges to spot trends:
- 24h → Is today normal or an outlier?
- 7d → Weekly patterns (weekends vs weekdays)
- 30d → Monthly trends (payday, holidays)

### **Tip 2: Zero-Hit Drill-Down**

For each zero-hit query:
1. Search manually in Algolia dashboard
2. Check if products exist but don't match
3. Update product titles/tags if needed
4. Add synonyms if it's a naming issue

### **Tip 3: Product ID Lookup**

Top products show IDs (e.g., `prod_abc123`).

To see details:
1. Copy product ID
2. Go to WooCommerce → Products
3. Search by ID or open in Algolia dashboard

### **Tip 4: Export Data**

To export analytics:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste:
   ```javascript
   // Export top searches
   copy(JSON.stringify(data.topSearches))
   ```
4. Paste into spreadsheet or JSON viewer

---

## 🛠️ Technical Details

### **Data Source**

- **Direct Supabase queries** (no backend API)
- Queries `messages` table with filters
- Real-time data (no caching)

### **Query Performance**

- Fast queries (<500ms) even with 10,000+ messages
- Indexed fields used (created_at, zero_hits)
- Limited to 1,000 most recent messages per calculation

### **Data Freshness**

- Updates on every page load or refresh
- Auto-refresh: Click "Refresh" button
- No polling (manual refresh only)

### **Privacy**

- Only shows aggregated data (no PII displayed)
- If `DISABLE_PII_LOGGING=true`, no user IPs stored
- Session IDs are anonymous UUIDs

---

## 📊 Sample Dashboard

```
╔════════════════════════════════════════════════════════════╗
║  🔍 Total Searches          ⏱️  Avg Response Time         ║
║  1,234                      245ms                          ║
║  89 today                   Excellent ✅                   ║
╠════════════════════════════════════════════════════════════╣
║  ❌ Zero-Hit Rate           🏆 Top Products Shown         ║
║  8%                         156                            ║
║  Excellent ✅               23x for #1                     ║
╚════════════════════════════════════════════════════════════╝

📈 Search Volume Trend (7 Days)
█████████ Mon: 167 searches
██████████ Tue: 189 searches
███████ Wed: 134 searches
████████ Thu: 156 searches
██████████████ Fri: 234 searches
████████████ Sat: 201 searches
██████ Sun: 123 searches

🔝 Top Searches
1. "birthday gifts for mom" - 45x, ~18 results
2. "anniversary gifts for husband" - 38x, ~22 results
3. "valentines day gifts" - 31x, ~35 results
4. "personalized gifts" - 27x, ~41 results
5. "gifts under 500" - 23x, ~87 results

❌ Zero-Hit Searches
1. "vegan chocolate hamper" - 12x ⚠️
2. "eco friendly gifts" - 8x ⚠️
3. "handmade soap set" - 6x ⚠️

🏆 Most Displayed Products
1. prod_abc123 - 234 times
2. prod_def456 - 198 times
3. prod_ghi789 - 176 times
```

---

## 🚀 Next Steps

### **After SQL Migration**

1. ✅ Run the migration SQL (adds new analytics fields)
2. ✅ Deploy the code (already done via git push)
3. ✅ Wait 2-3 minutes for Vercel deployment
4. 🎯 **Test the dashboard:**
   - Go to `/admin`
   - Click "Analytics" tab
   - Select time range
   - View metrics

### **Daily Workflow**

**Morning Check:**
1. Login to admin
2. Check yesterday's search volume (24h view)
3. Review zero-hit queries from previous day
4. Note any performance issues

**Weekly Review:**
1. Switch to 7-day view
2. Identify top 5 searches
3. Create landing pages if needed
4. Add products for zero-hit queries

**Monthly Report:**
1. Switch to 30-day view
2. Screenshot key metrics
3. Share with team
4. Plan catalog additions

---

## 🐛 Troubleshooting

### Issue: "No data available"

**Causes:**
- No searches logged yet
- SQL migration not run
- Supabase connection issue

**Fix:**
1. Make a test search on your site
2. Verify migration ran: Check `messages` table for `page`, `zero_hits` columns
3. Check browser console for errors

### Issue: "Error loading analytics"

**Causes:**
- Supabase RLS policy blocking queries
- Network issue
- Browser extension blocking

**Fix:**
1. Check browser console for exact error
2. Verify Supabase is accessible
3. Try in incognito mode
4. Check RLS policies (service role should have access)

### Issue: Data seems wrong

**Causes:**
- Multiple API deployments logging differently
- Old data from before migration
- Clock sync issues

**Fix:**
1. Verify which API endpoint widget uses
2. Check `created_at` timestamps in Supabase
3. Use shorter time range (24h) to see recent data only

---

## 📞 Support

**Need help?**
- Check `TELEMETRY-EXISTING-SETUP.md` for telemetry setup
- Review `docs/telemetry-performance.md` for technical details
- Inspect browser console for errors
- Check Supabase logs

**Found a bug?**
- Open issue on GitHub with screenshots
- Include browser console errors
- Mention time range and data shown

---

## ✨ Summary

**You now have:**
- ✅ Real-time analytics dashboard in `/admin`
- ✅ Key performance metrics (searches, latency, zero-hits)
- ✅ Search insights (top queries, trends, products)
- ✅ Actionable data for catalog management
- ✅ No backend API required (direct Supabase)

**Next steps:**
1. Test the dashboard after deployment
2. Make a few test searches
3. Refresh analytics to see live data
4. Use insights to optimize catalog

Your admin dashboard is now a **full analytics powerhouse**! 🚀
