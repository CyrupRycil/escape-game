import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {
      resolveAlias: {
        '@': '.',
      },
    },
  },
};

export default nextConfig;
```

Remets aussi le build command à la normale dans **Vercel → Settings → General → Build Command** :
```
next build