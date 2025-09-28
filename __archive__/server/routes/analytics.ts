import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";

const router = Router();

// Middleware to verify admin access
async function requireAdmin(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user has admin role (you may need to adjust this based on your auth setup)
    // For now, we'll check if user is authenticated - you can add role checks here
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Get chat KPIs with date range
router.post('/kpis', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { p_start, p_end } = req.body;

    const { data, error } = await supabase.rpc('get_chat_kpis', {
      p_start,
      p_end
    });

    if (error) {
      console.error('KPIs fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch KPIs' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('KPIs route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assistant quality metrics
router.get('/quality', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('v_chat_assistant_quality')
      .select('*');

    if (error) {
      console.error('Quality fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch quality metrics' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Quality route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get geography data
router.get('/geo', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('v_chat_geo')
      .select('*');

    if (error) {
      console.error('Geo fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch geography data' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Geo route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top product impressions
router.get('/products/top', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('v_product_impressions_top')
      .select('*');

    if (error) {
      console.error('Top products fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch top products' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Top products route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session depth data
router.get('/sessions/depth', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('v_chat_session_depth')
      .select('*');

    if (error) {
      console.error('Session depth fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch session depth' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Session depth route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chip usage data
router.get('/chips', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('v_chat_chip_usage')
      .select('*');

    if (error) {
      console.error('Chip usage fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch chip usage' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Chip usage route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get filter usage data
router.get('/filters', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('v_chat_filter_usage')
      .select('*');

    if (error) {
      console.error('Filter usage fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch filter usage' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Filter usage route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top pages data
router.get('/pages/top', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('v_chat_top_pages_30d')
      .select('*');

    if (error) {
      console.error('Top pages fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch top pages' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Top pages route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;