import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'propaganda';

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseServiceRoleKey);

const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    })
  : null;

const parseBase64Image = (imageBase64) => {
  const match = imageBase64.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/i);
  if (!match) {
    throw new Error('Formato inválido. Use PNG/JPG/JPEG em base64');
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[3];
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType.includes('png') ? 'png' : 'jpg';

  return { mimeType, buffer, ext };
};

const extractStoragePathFromUrl = (urlArquivo) => {
  if (!urlArquivo) return null;

  if (!urlArquivo.startsWith('http')) {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucketName}/`;
  const index = urlArquivo.indexOf(marker);
  if (index === -1) return null;

  return urlArquivo.substring(index + marker.length);
};

const supabaseStorageService = {
  isConfigured() {
    return hasSupabaseConfig;
  },

  getBucketName() {
    return bucketName;
  },

  async uploadImageBase64({ imageBase64, originalName }) {
    if (!hasSupabaseConfig || !supabase) {
      throw new Error('Supabase Storage não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    }

    const { mimeType, buffer, ext } = parseBase64Image(imageBase64);

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Imagem muito grande (máximo 5MB)');
    }

    const safeName = (originalName || 'imagem')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 80);

    const filePath = `propaganda/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType
      });

    if (uploadError) {
      throw new Error(`Erro ao enviar imagem para Supabase Storage: ${uploadError.message}`);
    }

    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      url: publicData?.publicUrl,
      path: filePath,
      size: buffer.length,
      mimeType
    };
  },

  async removeByUrl(urlArquivo) {
    if (!hasSupabaseConfig || !supabase) {
      return;
    }

    const storagePath = extractStoragePathFromUrl(urlArquivo);
    if (!storagePath) {
      return;
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Erro ao remover imagem do Supabase Storage: ${error.message}`);
    }
  }
};

export default supabaseStorageService;
