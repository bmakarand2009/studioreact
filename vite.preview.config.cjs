/**
 * Minimal Vite preview config for Docker/production.
 * Used when running `vite preview` in the container - the main vite.config.ts
 * is not copied to the production image, so this standalone config ensures
 * allowedHosts and host are set for cloud deployments (Render, etc.).
 */
module.exports = {
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173', 10),
    strictPort: false,
    allowedHosts: true,
  },
};
