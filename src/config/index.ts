import { StringSession } from 'telegram/sessions';
import { config } from 'dotenv';

config();

export const apiId = parseInt(process.env.API_ID || '', 10);
export const apiHash = process.env.API_HASH || '';
export const stringSession = new StringSession(process.env.ACCESS_TOKEN || '');
export const groupUsernames = ['testuserbotforme'];
