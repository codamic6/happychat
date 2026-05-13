import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HappyChat 2026',
    short_name: 'HappyChat',
    description: 'World\'s 1st Email-Based Messenger',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#00c853',
    icons: [
      {
        src: 'https://picsum.photos/seed/hc192/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/hc512/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
