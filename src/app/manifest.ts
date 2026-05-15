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
        src: '/mob.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/mob.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
