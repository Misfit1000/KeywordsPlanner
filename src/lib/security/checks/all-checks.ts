import { registerSecurityCheck } from './registry';

registerSecurityCheck({
  "id": "https-enabled",
  "category": "https",
  "severity": "critical",
  "title": "https enabled",
  "description": "Check for https enabled",
  "recommendation": "Fix https enabled",
  "weight": 1
});
registerSecurityCheck({
  "id": "http-redirects",
  "category": "https",
  "severity": "high",
  "title": "http redirects",
  "description": "Check for http redirects",
  "recommendation": "Fix http redirects",
  "weight": 1
});
registerSecurityCheck({
  "id": "mixed-content",
  "category": "https",
  "severity": "low",
  "title": "mixed content",
  "description": "Check for mixed content",
  "recommendation": "Fix mixed content",
  "weight": 1
});
registerSecurityCheck({
  "id": "final-url-http",
  "category": "https",
  "severity": "low",
  "title": "final url http",
  "description": "Check for final url http",
  "recommendation": "Fix final url http",
  "weight": 1
});
registerSecurityCheck({
  "id": "insecure-form-action",
  "category": "https",
  "severity": "low",
  "title": "insecure form action",
  "description": "Check for insecure form action",
  "recommendation": "Fix insecure form action",
  "weight": 1
});
registerSecurityCheck({
  "id": "external-scripts-http",
  "category": "https",
  "severity": "low",
  "title": "external scripts http",
  "description": "Check for external scripts http",
  "recommendation": "Fix external scripts http",
  "weight": 1
});
registerSecurityCheck({
  "id": "external-stylesheets-http",
  "category": "https",
  "severity": "low",
  "title": "external stylesheets http",
  "description": "Check for external stylesheets http",
  "recommendation": "Fix external stylesheets http",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-hsts",
  "category": "headers",
  "severity": "medium",
  "title": "missing hsts",
  "description": "Check for missing hsts",
  "recommendation": "Fix missing hsts",
  "weight": 1
});
registerSecurityCheck({
  "id": "hsts-max-age-low",
  "category": "headers",
  "severity": "low",
  "title": "hsts max age low",
  "description": "Check for hsts max age low",
  "recommendation": "Fix hsts max age low",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-csp",
  "category": "headers",
  "severity": "medium",
  "title": "missing csp",
  "description": "Check for missing csp",
  "recommendation": "Fix missing csp",
  "weight": 1
});
registerSecurityCheck({
  "id": "csp-unsafe-inline",
  "category": "headers",
  "severity": "low",
  "title": "csp unsafe inline",
  "description": "Check for csp unsafe inline",
  "recommendation": "Fix csp unsafe inline",
  "weight": 1
});
registerSecurityCheck({
  "id": "csp-unsafe-eval",
  "category": "headers",
  "severity": "low",
  "title": "csp unsafe eval",
  "description": "Check for csp unsafe eval",
  "recommendation": "Fix csp unsafe eval",
  "weight": 1
});
registerSecurityCheck({
  "id": "csp-wildcard-sources",
  "category": "headers",
  "severity": "low",
  "title": "csp wildcard sources",
  "description": "Check for csp wildcard sources",
  "recommendation": "Fix csp wildcard sources",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-content-type-options",
  "category": "headers",
  "severity": "medium",
  "title": "missing content type options",
  "description": "Check for missing content type options",
  "recommendation": "Fix missing content type options",
  "weight": 1
});
registerSecurityCheck({
  "id": "content-type-options-not-nosniff",
  "category": "headers",
  "severity": "low",
  "title": "content type options not nosniff",
  "description": "Check for content type options not nosniff",
  "recommendation": "Fix content type options not nosniff",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-frame-options",
  "category": "headers",
  "severity": "medium",
  "title": "missing frame options",
  "description": "Check for missing frame options",
  "recommendation": "Fix missing frame options",
  "weight": 1
});
registerSecurityCheck({
  "id": "frame-options-weak",
  "category": "headers",
  "severity": "low",
  "title": "frame options weak",
  "description": "Check for frame options weak",
  "recommendation": "Fix frame options weak",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-referrer-policy",
  "category": "headers",
  "severity": "medium",
  "title": "missing referrer policy",
  "description": "Check for missing referrer policy",
  "recommendation": "Fix missing referrer policy",
  "weight": 1
});
registerSecurityCheck({
  "id": "referrer-policy-permissive",
  "category": "headers",
  "severity": "low",
  "title": "referrer policy permissive",
  "description": "Check for referrer policy permissive",
  "recommendation": "Fix referrer policy permissive",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-permissions-policy",
  "category": "headers",
  "severity": "medium",
  "title": "missing permissions policy",
  "description": "Check for missing permissions policy",
  "recommendation": "Fix missing permissions policy",
  "weight": 1
});
registerSecurityCheck({
  "id": "permissions-policy-permissive",
  "category": "headers",
  "severity": "low",
  "title": "permissions policy permissive",
  "description": "Check for permissions policy permissive",
  "recommendation": "Fix permissions policy permissive",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-coop",
  "category": "headers",
  "severity": "medium",
  "title": "missing coop",
  "description": "Check for missing coop",
  "recommendation": "Fix missing coop",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-corp",
  "category": "headers",
  "severity": "medium",
  "title": "missing corp",
  "description": "Check for missing corp",
  "recommendation": "Fix missing corp",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-coep",
  "category": "headers",
  "severity": "medium",
  "title": "missing coep",
  "description": "Check for missing coep",
  "recommendation": "Fix missing coep",
  "weight": 1
});
registerSecurityCheck({
  "id": "cookie-missing-secure",
  "category": "cookies",
  "severity": "medium",
  "title": "cookie missing secure",
  "description": "Check for cookie missing secure",
  "recommendation": "Fix cookie missing secure",
  "weight": 1
});
registerSecurityCheck({
  "id": "cookie-missing-httponly",
  "category": "cookies",
  "severity": "medium",
  "title": "cookie missing httponly",
  "description": "Check for cookie missing httponly",
  "recommendation": "Fix cookie missing httponly",
  "weight": 1
});
registerSecurityCheck({
  "id": "cookie-missing-samesite",
  "category": "cookies",
  "severity": "medium",
  "title": "cookie missing samesite",
  "description": "Check for cookie missing samesite",
  "recommendation": "Fix cookie missing samesite",
  "weight": 1
});
registerSecurityCheck({
  "id": "samesite-none-without-secure",
  "category": "cookies",
  "severity": "low",
  "title": "samesite none without secure",
  "description": "Check for samesite none without secure",
  "recommendation": "Fix samesite none without secure",
  "weight": 1
});
registerSecurityCheck({
  "id": "cookie-broad-domain",
  "category": "cookies",
  "severity": "low",
  "title": "cookie broad domain",
  "description": "Check for cookie broad domain",
  "recommendation": "Fix cookie broad domain",
  "weight": 1
});
registerSecurityCheck({
  "id": "cookie-long-expiry",
  "category": "cookies",
  "severity": "low",
  "title": "cookie long expiry",
  "description": "Check for cookie long expiry",
  "recommendation": "Fix cookie long expiry",
  "weight": 1
});
registerSecurityCheck({
  "id": "session-cookie-missing-httponly",
  "category": "cookies",
  "severity": "medium",
  "title": "session cookie missing httponly",
  "description": "Check for session cookie missing httponly",
  "recommendation": "Fix session cookie missing httponly",
  "weight": 1
});
registerSecurityCheck({
  "id": "session-cookie-missing-secure",
  "category": "cookies",
  "severity": "medium",
  "title": "session cookie missing secure",
  "description": "Check for session cookie missing secure",
  "recommendation": "Fix session cookie missing secure",
  "weight": 1
});
registerSecurityCheck({
  "id": "cors-wildcard-origin",
  "category": "cors",
  "severity": "low",
  "title": "cors wildcard origin",
  "description": "Check for cors wildcard origin",
  "recommendation": "Fix cors wildcard origin",
  "weight": 1
});
registerSecurityCheck({
  "id": "cors-wildcard-credentials",
  "category": "cors",
  "severity": "low",
  "title": "cors wildcard credentials",
  "description": "Check for cors wildcard credentials",
  "recommendation": "Fix cors wildcard credentials",
  "weight": 1
});
registerSecurityCheck({
  "id": "cors-credentials-risky-origin",
  "category": "cors",
  "severity": "low",
  "title": "cors credentials risky origin",
  "description": "Check for cors credentials risky origin",
  "recommendation": "Fix cors credentials risky origin",
  "weight": 1
});
registerSecurityCheck({
  "id": "cors-exposed-headers-broad",
  "category": "cors",
  "severity": "low",
  "title": "cors exposed headers broad",
  "description": "Check for cors exposed headers broad",
  "recommendation": "Fix cors exposed headers broad",
  "weight": 1
});
registerSecurityCheck({
  "id": "login-form-http",
  "category": "forms",
  "severity": "low",
  "title": "login form http",
  "description": "Check for login form http",
  "recommendation": "Fix login form http",
  "weight": 1
});
registerSecurityCheck({
  "id": "password-autocomplete-not-controlled",
  "category": "forms",
  "severity": "low",
  "title": "password autocomplete not controlled",
  "description": "Check for password autocomplete not controlled",
  "recommendation": "Fix password autocomplete not controlled",
  "weight": 1
});
registerSecurityCheck({
  "id": "form-action-http",
  "category": "forms",
  "severity": "low",
  "title": "form action http",
  "description": "Check for form action http",
  "recommendation": "Fix form action http",
  "weight": 1
});
registerSecurityCheck({
  "id": "form-missing-csrf-signal",
  "category": "forms",
  "severity": "medium",
  "title": "form missing csrf signal",
  "description": "Check for form missing csrf signal",
  "recommendation": "Fix form missing csrf signal",
  "weight": 1
});
registerSecurityCheck({
  "id": "sensitive-form-get",
  "category": "forms",
  "severity": "low",
  "title": "sensitive form get",
  "description": "Check for sensitive form get",
  "recommendation": "Fix sensitive form get",
  "weight": 1
});
registerSecurityCheck({
  "id": "external-form-action",
  "category": "forms",
  "severity": "low",
  "title": "external form action",
  "description": "Check for external form action",
  "recommendation": "Fix external form action",
  "weight": 1
});
registerSecurityCheck({
  "id": "file-upload-no-restrictions",
  "category": "forms",
  "severity": "low",
  "title": "file upload no restrictions",
  "description": "Check for file upload no restrictions",
  "recommendation": "Fix file upload no restrictions",
  "weight": 1
});
registerSecurityCheck({
  "id": "server-header-exposes-tech",
  "category": "information disclosure",
  "severity": "low",
  "title": "server header exposes tech",
  "description": "Check for server header exposes tech",
  "recommendation": "Fix server header exposes tech",
  "weight": 1
});
registerSecurityCheck({
  "id": "x-powered-by-exposed",
  "category": "information disclosure",
  "severity": "low",
  "title": "x powered by exposed",
  "description": "Check for x powered by exposed",
  "recommendation": "Fix x powered by exposed",
  "weight": 1
});
registerSecurityCheck({
  "id": "error-stack-trace",
  "category": "information disclosure",
  "severity": "low",
  "title": "error stack trace",
  "description": "Check for error stack trace",
  "recommendation": "Fix error stack trace",
  "weight": 1
});
registerSecurityCheck({
  "id": "debug-mode-text",
  "category": "information disclosure",
  "severity": "low",
  "title": "debug mode text",
  "description": "Check for debug mode text",
  "recommendation": "Fix debug mode text",
  "weight": 1
});
registerSecurityCheck({
  "id": "exposed-version-string",
  "category": "information disclosure",
  "severity": "low",
  "title": "exposed version string",
  "description": "Check for exposed version string",
  "recommendation": "Fix exposed version string",
  "weight": 1
});
registerSecurityCheck({
  "id": "directory-listing",
  "category": "information disclosure",
  "severity": "low",
  "title": "directory listing",
  "description": "Check for directory listing",
  "recommendation": "Fix directory listing",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-env-file",
  "category": "information disclosure",
  "severity": "low",
  "title": "public env file",
  "description": "Check for public env file",
  "recommendation": "Fix public env file",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-git-head",
  "category": "information disclosure",
  "severity": "low",
  "title": "public git head",
  "description": "Check for public git head",
  "recommendation": "Fix public git head",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-config-php",
  "category": "information disclosure",
  "severity": "low",
  "title": "public config php",
  "description": "Check for public config php",
  "recommendation": "Fix public config php",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-backup-pattern",
  "category": "information disclosure",
  "severity": "low",
  "title": "public backup pattern",
  "description": "Check for public backup pattern",
  "recommendation": "Fix public backup pattern",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-db-dump",
  "category": "information disclosure",
  "severity": "low",
  "title": "public db dump",
  "description": "Check for public db dump",
  "recommendation": "Fix public db dump",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-phpinfo",
  "category": "information disclosure",
  "severity": "low",
  "title": "public phpinfo",
  "description": "Check for public phpinfo",
  "recommendation": "Fix public phpinfo",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-server-status",
  "category": "information disclosure",
  "severity": "low",
  "title": "public server status",
  "description": "Check for public server status",
  "recommendation": "Fix public server status",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-wp-config-bak",
  "category": "information disclosure",
  "severity": "low",
  "title": "public wp config bak",
  "description": "Check for public wp config bak",
  "recommendation": "Fix public wp config bak",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-source-maps",
  "category": "information disclosure",
  "severity": "low",
  "title": "public source maps",
  "description": "Check for public source maps",
  "recommendation": "Fix public source maps",
  "weight": 1
});
registerSecurityCheck({
  "id": "wp-version-exposed",
  "category": "dependency signals",
  "severity": "low",
  "title": "wp version exposed",
  "description": "Check for wp version exposed",
  "recommendation": "Fix wp version exposed",
  "weight": 1
});
registerSecurityCheck({
  "id": "wp-readme-exposed",
  "category": "dependency signals",
  "severity": "low",
  "title": "wp readme exposed",
  "description": "Check for wp readme exposed",
  "recommendation": "Fix wp readme exposed",
  "weight": 1
});
registerSecurityCheck({
  "id": "wp-admin-exposed",
  "category": "dependency signals",
  "severity": "low",
  "title": "wp admin exposed",
  "description": "Check for wp admin exposed",
  "recommendation": "Fix wp admin exposed",
  "weight": 1
});
registerSecurityCheck({
  "id": "outdated-library-version",
  "category": "dependency signals",
  "severity": "low",
  "title": "outdated library version",
  "description": "Check for outdated library version",
  "recommendation": "Fix outdated library version",
  "weight": 1
});
registerSecurityCheck({
  "id": "jquery-old-version",
  "category": "dependency signals",
  "severity": "low",
  "title": "jquery old version",
  "description": "Check for jquery old version",
  "recommendation": "Fix jquery old version",
  "weight": 1
});
registerSecurityCheck({
  "id": "exposed-package-metadata",
  "category": "dependency signals",
  "severity": "low",
  "title": "exposed package metadata",
  "description": "Check for exposed package metadata",
  "recommendation": "Fix exposed package metadata",
  "weight": 1
});
registerSecurityCheck({
  "id": "source-maps-expose-paths",
  "category": "dependency signals",
  "severity": "low",
  "title": "source maps expose paths",
  "description": "Check for source maps expose paths",
  "recommendation": "Fix source maps expose paths",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-anti-framing",
  "category": "clickjacking",
  "severity": "medium",
  "title": "missing anti framing",
  "description": "Check for missing anti framing",
  "recommendation": "Fix missing anti framing",
  "weight": 1
});
registerSecurityCheck({
  "id": "csp-frame-ancestors-missing",
  "category": "clickjacking",
  "severity": "medium",
  "title": "csp frame ancestors missing",
  "description": "Check for csp frame ancestors missing",
  "recommendation": "Fix csp frame ancestors missing",
  "weight": 1
});
registerSecurityCheck({
  "id": "x-frame-options-missing-no-csp",
  "category": "clickjacking",
  "severity": "medium",
  "title": "x frame options missing no csp",
  "description": "Check for x frame options missing no csp",
  "recommendation": "Fix x frame options missing no csp",
  "weight": 1
});
registerSecurityCheck({
  "id": "inline-scripts-heavy",
  "category": "content security",
  "severity": "low",
  "title": "inline scripts heavy",
  "description": "Check for inline scripts heavy",
  "recommendation": "Fix inline scripts heavy",
  "weight": 1
});
registerSecurityCheck({
  "id": "unsafe-inline-events",
  "category": "content security",
  "severity": "low",
  "title": "unsafe inline events",
  "description": "Check for unsafe inline events",
  "recommendation": "Fix unsafe inline events",
  "weight": 1
});
registerSecurityCheck({
  "id": "dangerous-js-sinks",
  "category": "content security",
  "severity": "low",
  "title": "dangerous js sinks",
  "description": "Check for dangerous js sinks",
  "recommendation": "Fix dangerous js sinks",
  "weight": 1
});
registerSecurityCheck({
  "id": "many-third-party-scripts",
  "category": "content security",
  "severity": "low",
  "title": "many third party scripts",
  "description": "Check for many third party scripts",
  "recommendation": "Fix many third party scripts",
  "weight": 1
});
registerSecurityCheck({
  "id": "unknown-third-party-script",
  "category": "content security",
  "severity": "low",
  "title": "unknown third party script",
  "description": "Check for unknown third party script",
  "recommendation": "Fix unknown third party script",
  "weight": 1
});
registerSecurityCheck({
  "id": "login-page-detected",
  "category": "auth surface",
  "severity": "low",
  "title": "login page detected",
  "description": "Check for login page detected",
  "recommendation": "Fix login page detected",
  "weight": 1
});
registerSecurityCheck({
  "id": "admin-page-detected",
  "category": "auth surface",
  "severity": "low",
  "title": "admin page detected",
  "description": "Check for admin page detected",
  "recommendation": "Fix admin page detected",
  "weight": 1
});
registerSecurityCheck({
  "id": "password-reset-detected",
  "category": "auth surface",
  "severity": "low",
  "title": "password reset detected",
  "description": "Check for password reset detected",
  "recommendation": "Fix password reset detected",
  "weight": 1
});
registerSecurityCheck({
  "id": "registration-page-detected",
  "category": "auth surface",
  "severity": "low",
  "title": "registration page detected",
  "description": "Check for registration page detected",
  "recommendation": "Fix registration page detected",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-security-txt",
  "category": "metadata",
  "severity": "medium",
  "title": "missing security txt",
  "description": "Check for missing security txt",
  "recommendation": "Fix missing security txt",
  "weight": 1
});
registerSecurityCheck({
  "id": "security-txt-invalid",
  "category": "metadata",
  "severity": "low",
  "title": "security txt invalid",
  "description": "Check for security txt invalid",
  "recommendation": "Fix security txt invalid",
  "weight": 1
});
registerSecurityCheck({
  "id": "security-txt-missing-contact",
  "category": "metadata",
  "severity": "medium",
  "title": "security txt missing contact",
  "description": "Check for security txt missing contact",
  "recommendation": "Fix security txt missing contact",
  "weight": 1
});
registerSecurityCheck({
  "id": "security-txt-missing-policy",
  "category": "metadata",
  "severity": "medium",
  "title": "security txt missing policy",
  "description": "Check for security txt missing policy",
  "recommendation": "Fix security txt missing policy",
  "weight": 1
});
registerSecurityCheck({
  "id": "robots-reveals-admin",
  "category": "robots",
  "severity": "low",
  "title": "robots reveals admin",
  "description": "Check for robots reveals admin",
  "recommendation": "Fix robots reveals admin",
  "weight": 1
});
registerSecurityCheck({
  "id": "robots-reveals-backup",
  "category": "robots",
  "severity": "low",
  "title": "robots reveals backup",
  "description": "Check for robots reveals backup",
  "recommendation": "Fix robots reveals backup",
  "weight": 1
});
registerSecurityCheck({
  "id": "sitemap-includes-private",
  "category": "robots",
  "severity": "low",
  "title": "sitemap includes private",
  "description": "Check for sitemap includes private",
  "recommendation": "Fix sitemap includes private",
  "weight": 1
});
registerSecurityCheck({
  "id": "spf-record-missing",
  "category": "email trust",
  "severity": "medium",
  "title": "spf record missing",
  "description": "Check for spf record missing",
  "recommendation": "Fix spf record missing",
  "weight": 1
});
registerSecurityCheck({
  "id": "dmarc-record-missing",
  "category": "email trust",
  "severity": "medium",
  "title": "dmarc record missing",
  "description": "Check for dmarc record missing",
  "recommendation": "Fix dmarc record missing",
  "weight": 1
});
registerSecurityCheck({
  "id": "dkim-record-missing",
  "category": "email trust",
  "severity": "medium",
  "title": "dkim record missing",
  "description": "Check for dkim record missing",
  "recommendation": "Fix dkim record missing",
  "weight": 1
});
registerSecurityCheck({
  "id": "missing-cache-control-sensitive",
  "category": "misconfiguration",
  "severity": "medium",
  "title": "missing cache control sensitive",
  "description": "Check for missing cache control sensitive",
  "recommendation": "Fix missing cache control sensitive",
  "weight": 1
});
registerSecurityCheck({
  "id": "public-api-endpoint",
  "category": "misconfiguration",
  "severity": "low",
  "title": "public api endpoint",
  "description": "Check for public api endpoint",
  "recommendation": "Fix public api endpoint",
  "weight": 1
});
registerSecurityCheck({
  "id": "api-exposes-stack",
  "category": "misconfiguration",
  "severity": "low",
  "title": "api exposes stack",
  "description": "Check for api exposes stack",
  "recommendation": "Fix api exposes stack",
  "weight": 1
});
registerSecurityCheck({
  "id": "json-missing-security-headers",
  "category": "misconfiguration",
  "severity": "medium",
  "title": "json missing security headers",
  "description": "Check for json missing security headers",
  "recommendation": "Fix json missing security headers",
  "weight": 1
});
registerSecurityCheck({
  "id": "excessive-options-methods",
  "category": "misconfiguration",
  "severity": "low",
  "title": "excessive options methods",
  "description": "Check for excessive options methods",
  "recommendation": "Fix excessive options methods",
  "weight": 1
});
registerSecurityCheck({
  "id": "trace-method-enabled",
  "category": "misconfiguration",
  "severity": "low",
  "title": "trace method enabled",
  "description": "Check for trace method enabled",
  "recommendation": "Fix trace method enabled",
  "weight": 1
});
