// sw.js

// ====================================================================================
// GanhosPro Service Worker
//
// Estratégias de Cache:
// 1. App Shell & Dynamic Content (HTML, JS, CSS, CDN scripts): Stale-While-Revalidate
//    - Carregamento instantâneo a partir do cache.
//    - Atualização em segundo plano para a próxima visita.
//    - Garante performance máxima sem sacrificar o frescor dos dados.
//
// 2. Assets Estáticos (Imagens, Ícones): Cache First
//    - Prioriza o cache para carregamento rápido e confiabilidade offline.
//    - A rede é consultada apenas se o asset não estiver em cache.
//
// 3. Fontes Externas (Google Fonts): Stale-While-Revalidate
//    - Mesma estratégia do App Shell para garantir renderização rápida do texto.
// ====================================================================================


// --- CONFIGURAÇÃO DE CACHE ---

// Versões do cache. Incrementar para forçar a atualização de um cache específico.
const CORE_CACHE_VERSION = 'ganhospro-core-v4';      // Para App Shell, scripts, e CDNs
const STATIC_CACHE_VERSION = 'ganhospro-static-v3'; // Para imagens e ícones
const FONTS_CACHE_VERSION = 'ganhospro-fonts-v3';   // Para fontes da web

// Nomes dos caches
const CORE_CACHE_NAME = CORE_CACHE_VERSION;
const STATIC_CACHE_NAME = STATIC_CACHE_VERSION;
const FONTS_CACHE_NAME = FONTS_CACHE_VERSION;

// Lista de todos os caches gerenciados por este Service Worker para limpeza segura.
const ALL_CACHES = [CORE_CACHE_NAME, STATIC_CACHE_NAME, FONTS_CACHE_NAME];

// URLs essenciais que compõem o App Shell.
// São cacheadas na instalação para garantir que o app funcione offline imediatamente.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];


// --- CICLO DE VIDA DO SERVICE WORKER ---

// Evento 'install': Prepara o cache do App Shell e outros assets essenciais.
self.addEventListener('install', event => {
  console.log('[SW] Evento: install');
  event.waitUntil(
    caches.open(CORE_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching App Shell...');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        // Força o novo Service Worker a se tornar ativo imediatamente,
        // pulando a fase de 'waiting'. Essencial para atualizações rápidas.
        console.log('[SW] Instalação concluída. Ativando imediatamente.');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Falha no cache do App Shell:', error);
      })
  );
});

// Evento 'activate': Limpa caches antigos para liberar espaço e evitar conflitos de versão.
self.addEventListener('activate', event => {
  console.log('[SW] Evento: activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não estiver na nossa lista de caches gerenciados, ele é antigo.
          if (!ALL_CACHES.includes(cacheName)) {
            console.log(`[SW] Deletando cache antigo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Assume o controle de todas as abas abertas que estão no escopo do SW.
        // Garante que o novo SW gerencie todas as páginas imediatamente.
        console.log('[SW] Ativado e controlando clientes.');
        return self.clients.claim();
    })
  );
});


// --- INTERCEPTAÇÃO DE REQUISIÇÕES (ROTEAMENTO) ---

// Evento 'fetch': Intercepta todas as requisições de rede e aplica a estratégia de cache apropriada.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições que não sejam GET e requisições de extensões do Chrome, que não devem ser cacheadas.
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // --- Roteamento de Requisições ---

  // Rota 1: Fontes do Google (Stale-While-Revalidate)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONTS_CACHE_NAME));
    return;
  }

  // Rota 2: Assets Estáticos - Imagens (Cache First)
  // `request.destination` é a forma mais confiável de identificar o tipo de recurso.
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // Rota 3: App Shell, Scripts, Estilos, Manifest e CDNs (Stale-While-Revalidate)
  // Cobre a navegação para a página e os recursos essenciais para renderizá-la.
  if (request.mode === 'navigate' || ['script', 'style', 'manifest'].includes(request.destination) || url.hostname.includes('aistudiocdn.com')) {
    event.respondWith(staleWhileRevalidate(request, CORE_CACHE_NAME));
    return;
  }

  // Fallback: Para qualquer outra requisição não tratada (ex: API calls), busca na rede.
  // Isso evita que o Service Worker interfira com requisições que não devem ser cacheadas.
});


// --- IMPLEMENTAÇÃO DAS ESTRATÉGIAS DE CACHE ---

/**
 * Estratégia: Stale-While-Revalidate
 * Responde com o cache imediatamente se disponível (stale).
 * Em paralelo, busca uma nova versão na rede (revalidate) e atualiza o cache para a próxima visita.
 * Se não houver cache, aguarda a resposta da rede.
 */
const staleWhileRevalidate = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponsePromise = cache.match(request);
    
    const networkResponsePromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(err => {
        console.warn(`[SW] Falha na busca de rede para ${request.url}.`, err);
    });

    return cachedResponsePromise.then(cachedResponse => cachedResponse || networkResponsePromise);
};

/**
 * Estratégia: Cache First (com fallback para a rede)
 * Tenta encontrar uma resposta correspondente no cache primeiro.
 * Se encontrar, retorna a resposta em cache.
 * Se não encontrar, busca na rede, armazena a nova resposta em cache e a retorna.
 */
const cacheFirst = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error(`[SW] Falha na busca de rede (Cache First) para ${request.url}.`, error);
        throw error;
    }
};
