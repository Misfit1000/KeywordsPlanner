# Account Export And Deletion

Settings provides a bounded JSON export and permanent deletion flow. Export includes account metadata, projects, imported keyword/competitor records, and up to 500 recent audit summaries. It excludes passwords, tokens, internal diagnostics, and full raw HTML.

Deletion requires an authenticated session, a login within 30 minutes, and the exact confirmation `DELETE`. Administrator accounts must transfer/remove their role first. The protected server function removes private audits and child records, projects, keywords, competitors, and the profile; editorial/admin references are de-identified before the authentication account is removed.

Because database deletion and authentication deletion are separate provider operations, failed deletion requests are logged by request ID for administrator recovery. Test with a disposable account before launch.
