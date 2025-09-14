export default {
  async fetch(request, env) {
    // 先讀靜態檔
    let res = await env.ASSETS.fetch(request);
    const url = new URL(request.url);

    // SPA fallback：沒有副檔名且 404 時，回 index.html
    if (res.status === 404 && request.method === 'GET' && !url.pathname.includes('.')) {
      res = await env.ASSETS.fetch(new Request(new URL('/', url), request));
    }

    // 只對 HTML 注入 config
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      const cfg = {
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID // 若未設定，JSON.stringify 會自動略過
      };

      let html = await res.text();
      const inject = `
<script id="app-config">
  // 你的 index.html 會 JSON.parse(__firebase_config)
  window.__app_id = ${JSON.stringify(env.APP_ID || 'kaohsiung-youth')};
  window.__firebase_config = ${JSON.stringify(JSON.stringify(cfg))};
</script>`.trim();

      html = html.replace('</head>', `${inject}\n</head>`);
      return new Response(html, {
        headers: { 'content-type': ct, 'cache-control': 'no-store' }
      });
    }

    return res;
  }
};
