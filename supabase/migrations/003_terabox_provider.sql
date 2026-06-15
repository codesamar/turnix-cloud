-- Add TeraBox as a session-based cloud provider

alter type public.cloud_provider add value if not exists 'terabox';
