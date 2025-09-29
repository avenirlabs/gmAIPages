// api/menus/[slug].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../_services/supabase.js';

const T = {
  MENU: process.env.MENU_TBL || 'menus',
  ITEMS: process.env.MENU_ITEMS_TBL || 'menu_items',
  COLS: process.env.MENU_COLS_TBL || 'menu_columns',
  LINKS: process.env.MENU_LINKS_TBL || 'menu_links',
  SITE: process.env.MENU_SITE_ID_COL || 'site_id',
  ORD: process.env.MENU_ORDER_COL || 'order_index',
};

function sendJSON(res: VercelResponse, code: number, body: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(code).end(JSON.stringify(body));
}

function normalizeMenu(raw: any) {
  // Convert DB shape -> editor shape
  const items = (raw.items || []).sort((a:any,b:any)=> (a[T.ORD]??0)-(b[T.ORD]??0)).map((it:any)=> {
    if (it.type === 'mega') {
      const columns = (it.columns || []).sort((a:any,b:any)=> (a[T.ORD]??0)-(b[T.ORD]??0)).map((c:any)=> ({
        heading: c.heading ?? c.title ?? '',
        links: (c.links || []).sort((a:any,b:any)=> (a[T.ORD]??0)-(b[T.ORD]??0)).map((ln:any)=> ({
          label: ln.label ?? ln.title ?? '',
          to: ln.to ?? ln.href ?? '#'
        }))
      }));
      return { type: 'mega', label: it.label ?? it.title ?? 'Menu', columns };
    }
    // simple link/category
    return {
      type: it.type ?? 'link',
      label: it.label ?? it.title ?? 'Item',
      to: it.to ?? it.href ?? '#'
    };
  });
  return {
    slug: raw.slug,
    title: raw.title ?? raw.name ?? raw.slug,
    items
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = String(req.query.slug || 'main');
  const supa = getServiceSupabase();

  if (req.method === 'GET') {
    try {
      // DB → fallback strategy
      if (supa) {
        // Pull menu + nested graph
        const { data, error } = await supa
          .from(T.MENU)
          .select(`
            id, slug, title,
            items:${T.ITEMS}(
              id, type, label, to, ${T.ORD},
              columns:${T.COLS}(
                id, heading, title, ${T.ORD},
                links:${T.LINKS}(id, label, title, to, href, ${T.ORD})
              )
            )
          `)
          .eq('slug', slug)
          .maybeSingle();

        if (error) {
          console.warn('[menu:get] supabase error', error.message);
        } else if (data) {
          return sendJSON(res, 200, { ok: true, slug, menu: normalizeMenu(data) });
        }
      }

      // Fallback: existing minimal fallback you had earlier
      return sendJSON(res, 200, {
        ok: true,
        slug,
        menu: {
          slug: 'main',
          items: [
            { type: 'link', label: 'Home', to: '/' },
            {
              type: 'mega',
              label: 'Shop',
              columns: [
                { heading: 'Gifts', links: [{ label: 'For Dad', to: '/gifts/dad' }, { label: 'For Mom', to: '/gifts/mom' }] },
                { heading: 'Occasions', links: [{ label: 'Birthday', to: '/gifts/birthday' }, { label: 'Anniversary', to: '/gifts/anniversary' }] }
              ]
            }
          ]
        }
      });
    } catch (e:any) {
      console.error('[menu:get] handler error', e?.message || e);
      return sendJSON(res, 500, { ok: false, error: 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    // Save route: upsert menu tree (service role only)
    if (!supa) {
      return sendJSON(res, 503, { ok: false, error: 'Supabase not configured' });
    }
    try {
      const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const menu = body?.menu;
      if (!menu || !Array.isArray(menu.items)) {
        return sendJSON(res, 400, { ok: false, error: 'Invalid payload: { menu: { items: [...] } }' });
      }

      // 1) Ensure menu row exists
      const { data: menuRow, error: mErr } = await supa
        .from(T.MENU)
        .upsert({ slug, title: menu.title ?? slug })
        .select('id')
        .single();
      if (mErr) return sendJSON(res, 500, { ok: false, error: mErr.message });
      const menuId = menuRow.id;

      // 2) Clear existing items/columns/links (simple approach; transactional if pg functions exist)
      await supa.from(T.LINKS).delete().in('id', supa.rpc ? [] : []); // no-op placeholder if you don't want to cascade
      await supa.from(T.COLS).delete().eq('menu_id', menuId); // adjust foreign key names if different
      await supa.from(T.ITEMS).delete().eq('menu_id', menuId);

      // 3) Insert items with ordering
      for (let i = 0; i < menu.items.length; i++) {
        const it = menu.items[i];
        const { data: insItem, error: iErr } = await supa
          .from(T.ITEMS)
          .insert({
            menu_id: menuId,
            type: it.type,
            label: it.label,
            to: it.to ?? null,
            [T.ORD]: i
          })
          .select('id')
          .single();
        if (iErr) return sendJSON(res, 500, { ok: false, error: iErr.message });

        // If mega, insert columns + links
        if (it.type === 'mega' && Array.isArray(it.columns)) {
          for (let c = 0; c < it.columns.length; c++) {
            const col = it.columns[c];
            const { data: insCol, error: cErr } = await supa
              .from(T.COLS)
              .insert({
                menu_id: menuId,
                item_id: insItem.id,
                heading: col.heading,
                [T.ORD]: c
              })
              .select('id')
              .single();
            if (cErr) return sendJSON(res, 500, { ok: false, error: cErr.message });

            for (let k = 0; k < (col.links || []).length; k++) {
              const ln = col.links[k];
              const { error: lErr } = await supa
                .from(T.LINKS)
                .insert({
                  menu_id: menuId,
                  column_id: insCol.id,
                  label: ln.label,
                  to: ln.to,
                  [T.ORD]: k
                });
              if (lErr) return sendJSON(res, 500, { ok: false, error: lErr.message });
            }
          }
        }
      }

      return sendJSON(res, 200, { ok: true, slug, saved: true });
    } catch (e:any) {
      console.error('[menu:post] save error', e?.message || e);
      return sendJSON(res, 500, { ok: false, error: 'Save failed' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
}