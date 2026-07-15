# Provider-disabled mode

The default production state is NVIDIA NIM with model `qwen/qwen3.5-122b-a10b`, status **Not configured**, `NVIDIA_BLOG_ENABLED=false`, and automatic generation disabled.

Manual article writing, source management, editorial review, calendar scheduling, image import, and static publishing remain available. Live drafting, live section revision, and automatic AI drafting stay disabled with a clear explanation. Fixture actions appear only when every protected fixture switch allows them.

To activate NVIDIA later, add the NVIDIA variables to the Render worker, redeploy, run the protected provider test and opt-in live smoke, generate one unpublished draft, and keep review-first mode enabled. Never place the key in Vercel or a `VITE_` variable.
