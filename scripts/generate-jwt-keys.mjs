import { exportJWK, exportPKCS8, generateKeyPair } from 'jose'

const keys = await generateKeyPair('RS256', {
  extractable: true,
})

const privateKey = await exportPKCS8(keys.privateKey)
const publicKey = await exportJWK(keys.publicKey)

const jwks = JSON.stringify({
  keys: [
    {
      use: 'sig',
      ...publicKey,
    },
  ],
})

const formattedPrivateKey = privateKey.trimEnd().replace(/\n/g, ' ')

console.log('Copy these values to Convex environment variables:')
console.log('')
console.log('JWT_PRIVATE_KEY:')
console.log(formattedPrivateKey)
console.log('')
console.log('JWKS:')
console.log(jwks)
console.log('')
console.log('---')
console.log('Or use these commands (-- prevents the key from being parsed as CLI options):')
console.log(`pnpm exec convex env set JWT_PRIVATE_KEY -- '${formattedPrivateKey}'`)
console.log(`pnpm exec convex env set JWKS -- '${jwks}'`)
