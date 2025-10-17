const CORE_CACHE_NAME = 'ganhospro-core-v2';
const STATIC_CACHE_NAME = 'ganhospro-static-v1';
const FONTS_CACHE_NAME = 'ganhospro-fonts-v1';
const ALL_CACHES = [CORE_CACHE_NAME, STATIC_CACHE_NAME, FONTS_CACHE_NAME];

// URLs que constituem o "shell" do aplicativo
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// Na instalação, armazena o shell do aplicativo em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CORE_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Na ativação, limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!ALL_CACHES.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Ao buscar recursos, aplica as estratégias de cache
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignora requisições que não sejam GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Estratégia Cache-first para fontes do Google CDN.
  // Garante que o CSS das fontes e os arquivos de fonte (.woff2) sejam servidos rapidamente.
  if (request.url.startsWith('https://fonts.googleapis.com') || request.url.startsWith('https://fonts.gstatic.com')) {
    event.respondWith(
      caches.open(FONTS_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          // Retorna do cache se existir, senão, busca na rede.
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Estratégia: Cache-first para assets estáticos (imagens/ícones)
  // Eles são servidos do cache primeiro por não mudarem com frequência.
  if (request.url.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          // Retorna do cache, ou busca na rede e depois armazena em cache
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Estratégia: Stale-while-revalidate para os recursos principais (HTML, CSS, JS de CDNs)
  // Isso garante que o aplicativo carregue rápido do cache enquanto busca atualizações em segundo plano.
  event.respondWith(
    caches.open(CORE_CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        // Busca em segundo plano para atualizar o cache
        const fetchPromise = fetch(request).then(networkResponse => {
          // Verifica se a resposta é válida antes de colocar em cache
          if (networkResponse && networkResponse.status === 200) {
             cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
            console.error('Service Worker fetch error:', error);
            // Importante se a rede estiver offline e o item não estiver em cache
            throw error;
        });
        
        // Retorna a resposta do cache imediatamente se disponível, senão, aguarda a rede
        return cachedResponse || fetchPromise;
      });
    })
  );
});