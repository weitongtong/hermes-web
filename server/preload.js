import dotenv from 'dotenv';
import { hermesPath } from './utils/hermes-paths.js';

dotenv.config({ path: hermesPath('.env') });
