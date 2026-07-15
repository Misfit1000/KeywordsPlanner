# Approved source management

Apply migration 014, then use Admin > Blog > Editorial operations > Sources. Record the source name, publisher, HTTPS URL, feed type, topic clusters, trust level, primary/secondary classification, fetch frequency, and notes.

Testing uses the shared public-fetch boundary: DNS pinning, private-network blocking, standard ports, three redirects, one-megabyte response limit, safe content types, and bounded XML parsing. Safe failure codes are stored without raw response bodies. Google search result scraping is not supported.

Pause a source instead of deleting it when its history remains useful. Delete requires a reason and creates an administrator audit entry.
