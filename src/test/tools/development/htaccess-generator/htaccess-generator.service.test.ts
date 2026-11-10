import { describe, expect, it } from 'vitest'

import {
  buildHtaccess,
  type HtaccessConfig,
} from '@/tools/development/htaccess-generator/htaccess-generator.service'

const emptyConfig: HtaccessConfig = {
  forceHttps: false,
  forceWww: false,
  redirects: [],
  customRules: '',
  enableRewrite: true,
}

describe('htaccess-generator service', () => {
  describe('buildHtaccess', () => {
    it('adds the rewrite engine and force rules', () => {
      const output = buildHtaccess({ ...emptyConfig, forceHttps: true, forceWww: true })

      expect(output).toContain('RewriteEngine On')
      expect(output).toContain('# Force HTTPS')
      expect(output).toContain('RewriteCond %{HTTPS} off')
      expect(output).toContain('# Force www')
      expect(output).toContain('RewriteCond %{HTTP_HOST} !^www\\. [NC]')
      expect(output).toContain('R=301')
    })

    it('escapes path redirects and keeps the status code', () => {
      const output = buildHtaccess({
        ...emptyConfig,
        redirects: [
          { from: '/old-page.html', to: '/new-page', status: 301 },
          { from: '/temp', to: '/target', status: 302 },
        ],
      })

      expect(output).toContain('RewriteRule ^/old-page\\.html/?$ /new-page [R=301,L]')
      expect(output).toContain('RewriteRule ^/temp/?$ /target [R=302,L]')
    })

    it('uses the Redirect directive for absolute sources', () => {
      const output = buildHtaccess({
        ...emptyConfig,
        redirects: [
          {
            from: 'https://old.example.com/a',
            to: 'https://new.example.com/a',
            status: 301,
          },
        ],
      })

      expect(output).toContain(
        'Redirect 301 https://old.example.com/a https://new.example.com/a',
      )
      expect(output).toContain('# Absolute redirects')
    })

    it('appends custom rules verbatim', () => {
      const output = buildHtaccess({
        ...emptyConfig,
        customRules: '# block dotfiles\n<Files ".env">\n  Require all denied\n</Files>',
      })

      expect(output).toContain('# Custom rules')
      expect(output).toContain('<Files ".env">')
      expect(output).toContain('RewriteEngine On')
    })

    it('omits the rewrite engine when disabled and only custom rules exist', () => {
      const output = buildHtaccess({
        ...emptyConfig,
        enableRewrite: false,
        customRules: 'ErrorDocument 404 /404.html',
      })

      expect(output).not.toContain('RewriteEngine On')
      expect(output).toContain('ErrorDocument 404 /404.html')
    })

    it('throws for an empty configuration', () => {
      expect(() => buildHtaccess(emptyConfig)).toThrow(
        'Nothing to generate: enable an option or add at least one rule',
      )
    })

    it('throws for unsupported status codes and invalid paths', () => {
      expect(() =>
        buildHtaccess({
          ...emptyConfig,
          redirects: [{ from: '/a', to: '/b', status: 308 as 301 }],
        }),
      ).toThrow('Redirect 1 has an unsupported status code')

      expect(() =>
        buildHtaccess({
          ...emptyConfig,
          redirects: [{ from: 'old-page', to: '/new', status: 301 }],
        }),
      ).toThrow('Redirect 1 source must start with / or http(s)://')

      expect(() =>
        buildHtaccess({
          ...emptyConfig,
          redirects: [{ from: '/old', to: '/new page', status: 301 }],
        }),
      ).toThrow('Redirect 1 target must not contain quotes or whitespace')
    })

    it('throws for empty redirect targets', () => {
      expect(() =>
        buildHtaccess({
          ...emptyConfig,
          redirects: [{ from: '/old', to: '', status: 301 }],
        }),
      ).toThrow('Redirect 1 target is empty')
    })
  })
})
