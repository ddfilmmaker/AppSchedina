import { app } from '../server/app';

export default (req: any, res: any) => {
  // Strip /api prefix so Express routes match correctly
  req.url = req.url.replace(/^\/api/, "") || "/";
  return app(req, res);
};