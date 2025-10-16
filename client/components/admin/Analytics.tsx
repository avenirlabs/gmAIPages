import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  totalSearches: number;
  searchesToday: number;
  avgLatency: number;
  zeroHitRate: number;
  topSearches: Array<{ query: string; count: number; avgResults: number }>;
  zeroHitSearches: Array<{ query: string; count: number }>;
  topProducts: Array<{ productId: string; count: number }>;
  searchTrend: Array<{ hour: string; searches: number; avgLatency: number }>;
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case "24h":
          startDate.setHours(now.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
      }

      // Fetch total searches
      const { count: totalSearches } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString());

      // Fetch searches today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: searchesToday } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString());

      // Fetch messages for calculations
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("user_text, products_count, latency_ms, zero_hits, product_ids, created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      if (messagesError) throw messagesError;

      // Calculate average latency
      const avgLatency =
        messages && messages.length > 0
          ? Math.round(
              messages.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / messages.length
            )
          : 0;

      // Calculate zero-hit rate
      const zeroHits = messages?.filter((m) => m.zero_hits).length || 0;
      const zeroHitRate =
        messages && messages.length > 0
          ? Math.round((zeroHits / messages.length) * 100)
          : 0;

      // Top searches
      const searchCounts = new Map<string, { count: number; totalResults: number }>();
      messages?.forEach((m) => {
        const query = m.user_text?.trim().toLowerCase();
        if (query) {
          const existing = searchCounts.get(query) || { count: 0, totalResults: 0 };
          searchCounts.set(query, {
            count: existing.count + 1,
            totalResults: existing.totalResults + (m.products_count || 0),
          });
        }
      });
      const topSearches = Array.from(searchCounts.entries())
        .map(([query, stats]) => ({
          query,
          count: stats.count,
          avgResults: Math.round(stats.totalResults / stats.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Zero-hit searches
      const zeroHitCounts = new Map<string, number>();
      messages
        ?.filter((m) => m.zero_hits)
        .forEach((m) => {
          const query = m.user_text?.trim().toLowerCase();
          if (query) {
            zeroHitCounts.set(query, (zeroHitCounts.get(query) || 0) + 1);
          }
        });
      const zeroHitSearches = Array.from(zeroHitCounts.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top products
      const productCounts = new Map<string, number>();
      messages?.forEach((m) => {
        if (m.product_ids && Array.isArray(m.product_ids)) {
          m.product_ids.forEach((id: string) => {
            productCounts.set(id, (productCounts.get(id) || 0) + 1);
          });
        }
      });
      const topProducts = Array.from(productCounts.entries())
        .map(([productId, count]) => ({ productId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Search trend (hourly for 24h, daily for longer periods)
      const searchTrend: Array<{ hour: string; searches: number; avgLatency: number }> = [];
      if (timeRange === "24h") {
        // Hourly buckets
        const hourBuckets = new Map<string, { count: number; totalLatency: number }>();
        messages?.forEach((m) => {
          const date = new Date(m.created_at);
          const hour = `${date.getHours().toString().padStart(2, "0")}:00`;
          const existing = hourBuckets.get(hour) || { count: 0, totalLatency: 0 };
          hourBuckets.set(hour, {
            count: existing.count + 1,
            totalLatency: existing.totalLatency + (m.latency_ms || 0),
          });
        });
        searchTrend.push(
          ...Array.from(hourBuckets.entries())
            .map(([hour, stats]) => ({
              hour,
              searches: stats.count,
              avgLatency: Math.round(stats.totalLatency / stats.count),
            }))
            .sort((a, b) => a.hour.localeCompare(b.hour))
        );
      } else {
        // Daily buckets
        const dayBuckets = new Map<string, { count: number; totalLatency: number }>();
        messages?.forEach((m) => {
          const date = new Date(m.created_at);
          const day = date.toISOString().split("T")[0];
          const existing = dayBuckets.get(day) || { count: 0, totalLatency: 0 };
          dayBuckets.set(day, {
            count: existing.count + 1,
            totalLatency: existing.totalLatency + (m.latency_ms || 0),
          });
        });
        searchTrend.push(
          ...Array.from(dayBuckets.entries())
            .map(([hour, stats]) => ({
              hour,
              searches: stats.count,
              avgLatency: Math.round(stats.totalLatency / stats.count),
            }))
            .sort((a, b) => a.hour.localeCompare(b.hour))
        );
      }

      setData({
        totalSearches: totalSearches || 0,
        searchesToday: searchesToday || 0,
        avgLatency,
        zeroHitRate,
        topSearches,
        zeroHitSearches,
        topProducts,
        searchTrend,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="mb-2 font-semibold text-red-900">Error loading analytics</h3>
        <p className="text-sm text-red-700">{error}</p>
        <Button onClick={loadAnalytics} className="mt-4" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Time Range:</span>
        <div className="flex gap-2">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
            >
              {range === "24h" ? "24 Hours" : range === "7d" ? "7 Days" : "30 Days"}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={loadAnalytics} className="ml-auto">
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Searches</CardDescription>
            <CardTitle className="text-3xl">{data.totalSearches.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.searchesToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Response Time</CardDescription>
            <CardTitle className="text-3xl">{data.avgLatency}ms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.avgLatency < 300 ? "Excellent" : data.avgLatency < 500 ? "Good" : "Needs attention"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Zero-Hit Rate</CardDescription>
            <CardTitle className="text-3xl">{data.zeroHitRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.zeroHitRate < 10 ? "Excellent" : data.zeroHitRate < 25 ? "Good" : "Needs attention"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Products Shown</CardDescription>
            <CardTitle className="text-3xl">{data.topProducts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.topProducts[0]?.count || 0} times for #1
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Search Volume Trend</CardTitle>
          <CardDescription>
            {timeRange === "24h" ? "Hourly" : "Daily"} search activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.searchTrend.length > 0 ? (
              <div className="relative h-48">
                <div className="absolute inset-0 flex items-end justify-between gap-1">
                  {data.searchTrend.map((point, i) => {
                    const maxSearches = Math.max(...data.searchTrend.map((p) => p.searches));
                    const height = (point.searches / maxSearches) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-[#155ca5] hover:bg-[#1e7bd8] transition-colors rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${point.hour}: ${point.searches} searches, ${point.avgLatency}ms avg`}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No trend data available</p>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{data.searchTrend[0]?.hour || "N/A"}</span>
              <span>{data.searchTrend[data.searchTrend.length - 1]?.hour || "N/A"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Searches & Zero-Hit Searches */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Searches</CardTitle>
            <CardDescription>Most popular queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topSearches.length > 0 ? (
                data.topSearches.map((search, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex-1 truncate text-sm">{search.query}</div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{search.count}x</span>
                      <span className="text-[#155ca5]">~{search.avgResults} results</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No searches yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zero-Hit Searches</CardTitle>
            <CardDescription>Queries that returned no results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.zeroHitSearches.length > 0 ? (
                data.zeroHitSearches.map((search, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex-1 truncate text-sm text-red-700">{search.query}</div>
                    <div className="text-xs text-red-600">{search.count}x</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-green-600">No zero-hit searches! ✓</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Most Displayed Products</CardTitle>
          <CardDescription>Products shown most frequently in search results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topProducts.length > 0 ? (
              data.topProducts.map((product, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DBEBFF] text-xs font-semibold text-[#155ca5]">
                      {i + 1}
                    </span>
                    <span className="text-sm font-mono">{product.productId}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{product.count} times</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No product data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
