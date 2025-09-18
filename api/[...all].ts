import { app, init } from './app';

export default async (req: any, res: any) => {
  // Wait for app initialization to complete before handling requests
  await init;
  
  // Strip /api prefix so Express routes match correctly
  req.url = req.url.replace(/^\/api/, "") || "/";
  return app(req, res);
};