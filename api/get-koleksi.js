import { createClient } from '@supabase/supabase-js';
import { createClient as createRedisClient } from 'redis';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const redis = createRedisClient({ url: process.env.REDIS_URL });

export default async function handler(req, res) {
    await redis.connect();
    const cacheKey = 'katalog_koleksi';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        await redis.disconnect();
        return res.status(200).json(JSON.parse(cachedData));
    }

    const { data, error } = await supabase.from('koleksi').select('id, judul, path');
    
    if (data) {
        await redis.set(cacheKey, JSON.stringify(data), { EX: 60 });
    }
    
    await redis.disconnect();
    return res.status(200).json(data || error);
}
