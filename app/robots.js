export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/'], // Search engines should not index the admin dashboard
    },
    sitemap: 'https://streamfy.mirzashafi.com/sitemap.xml',
  }
}
