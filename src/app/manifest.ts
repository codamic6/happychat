import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HappyChat',
    short_name: 'HappyChat',
    description: 'Simple Email-Based Messaging',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#00c853',
    icons: [
      {
        src: 'https://picsum.photos/seed/hc-brand/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/hc-brand/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
