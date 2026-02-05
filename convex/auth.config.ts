export default {
  providers: [
    {
      domain:
        (typeof process !== 'undefined' && process.env.CONVEX_SITE_URL) ||
        'https://backend.stroop.janjs.dev',
      applicationID: 'convex',
    },
  ],
}
