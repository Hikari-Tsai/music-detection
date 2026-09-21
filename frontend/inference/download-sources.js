// Browser and Python share the same pinned download configuration.
import sources from './download-sources.json' with { type: 'json' };
export const DOWNLOAD_SOURCES = sources;
