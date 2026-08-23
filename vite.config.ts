import { defineConfig } from 'vite';

const repositoryName = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/';

export default defineConfig({
  base: repositoryName,
  server: {
    proxy: {
      '/jma-feed': {
        target: 'https://www.data.jma.go.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jma-feed/, '')
      }
    }
  },
  preview: {
    proxy: {
      '/jma-feed': {
        target: 'https://www.data.jma.go.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jma-feed/, '')
      }
    }
  }
});