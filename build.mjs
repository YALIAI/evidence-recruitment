import {build} from 'esbuild';
await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,outfile:'docs/app.js',platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
