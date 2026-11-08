import { llms, txt } from '../lib/llms';
export const GET = () => txt(llms(false));
