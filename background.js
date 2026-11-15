// background.js

// Fonction pour extraire l'ID et le type de boutique depuis une URL
function parseUrl(url) {
  if (url.includes('lovegobuy.com')) return null;

  // Weidian : weidian.com/item.html?itemID=... ou shopXXXX.v.weidian.com/item.html?itemID=...
  let m = url.match(/item\.html\?itemID=(\d+)/);
  if (m) return { id: m[1], shopType: 'weidian' };

  // Taobao : item.taobao.com/item.htm?id=...
  m = url.match(/item\.htm\?id=(\d+)/);
  if (m) return { id: m[1], shopType: 'taobao' };

  // 1688 : detail.1688.com/offer/XXXX.html
  m = url.match(/detail\.1688\.com\/offer\/(\d+)\.html/);
  if (m) return { id: m[1], shopType: 'ali_1688' };

  return null;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;
  const url = changeInfo.url;
  const parsed = parseUrl(url);
  if (!parsed) return;

  // Éviter de réinjecter la confirmation si on est déjà sur la page de confirmation
  if (url.startsWith('chrome-extension://')) return;

  const lovegobuyUrl = `https://www.lovegobuy.com/product?id=${parsed.id}&shop_type=${parsed.shopType}&invite_code=GLX`;

  // Injecter la page de confirmation dans l'onglet
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: showConfirmPage,
    args: [lovegobuyUrl]
  }).catch(err => console.error('Injection échouée', err));
});

// Cette fonction s'exécute dans la page (contexte de l'onglet)
function showConfirmPage(lovegobuyUrl) {
  // Éviter les doublons
  if (document.getElementById('lovegobuy-confirm-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'lovegobuy-confirm-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); z-index: 2147483647;
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background: #fff; border-radius: 12px; padding: 28px 32px;
    max-width: 420px; text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  `;

  box.innerHTML = `
    <p style="font-size: 16px; margin: 0 0 20px; color: #333;">
      Voulez-vous être redirigé vers <strong>Lovegobuy</strong> ?
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="lovegobuy-yes" style="
        padding: 10px 24px; border: none; border-radius: 8px;
        background: #22c55e; color: #fff; font-size: 15px;
        cursor: pointer; font-weight: 600;
      ">Oui</button>
      <button id="lovegobuy-no" style="
        padding: 10px 24px; border: none; border-radius: 8px;
        background: #e5e7eb; color: #333; font-size: 15px;
        cursor: pointer; font-weight: 600;
      ">Non</button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById('lovegobuy-yes').addEventListener('click', () => {
    window.location.href = lovegobuyUrl;
  });

  document.getElementById('lovegobuy-no').addEventListener('click', () => {
    overlay.remove();
    // Optionnel : revenir en arrière
    history.back();
  });
}