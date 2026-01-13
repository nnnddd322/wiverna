import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Presentation = Database['public']['Tables']['presentations']['Row'];
type PresentationInsert = Database['public']['Tables']['presentations']['Insert'];
type PresentationUpdate = Database['public']['Tables']['presentations']['Update'];

export const presentationService = {
  async getPresentationByLectureId(lectureId: string) {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('lecture_id', lectureId)
      .maybeSingle();

    if (error) {
      console.error('Error loading presentation:', error);
      throw error;
    }

    return data as Presentation | null;
  },

  async uploadPresentationFile(file: File, lectureId: string) {
    // Standard path: presentations/<lectureId>/source.pptx
    const filePath = `${lectureId}/source.pptx`;

    // Remove old file if exists (for re-upload)
    await supabase.storage
      .from('presentations')
      .remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from('presentations')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    return filePath;
  },

  async upsertPresentation(lectureId: string, filePath: string) {
    // Upsert: one lecture -> one presentation record
    const { data, error } = await supabase
      .from('presentations')
      .upsert({
        lecture_id: lectureId,
        file_path: filePath,
        status: 'processing',
        error_message: null,
        slides_data: null,
      }, {
        onConflict: 'lecture_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting presentation:', error);
      throw error;
    }

    return data as Presentation;
  },

  async updatePresentationStatus(
    id: string,
    status: 'processing' | 'ready' | 'error',
    slidesData?: any,
    errorMessage?: string
  ) {
    const updates: PresentationUpdate = { status };

    if (slidesData) {
      updates.slides_data = slidesData;
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { data, error } = await supabase
      .from('presentations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating presentation:', error);
      throw error;
    }

    return data as Presentation;
  },


  getPresentationUrl(filePath: string) {
    const { data } = supabase.storage
      .from('presentations')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async triggerConversion(lectureId: string) {
    // Call Edge Function bright-handler with JWT
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/bright-handler`;
    
    // Get current session for JWT
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Требуется авторизация для запуска конвертации');
    }

    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ lectureId }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Edge error ${response.status}`);
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Error calling Edge Function:', error);
      throw error;
    }
  },

  async uploadAndCreatePresentation(file: File, lectureId: string) {
    // Atomic operation: upload + create record + trigger conversion
    // Step 1: Check if already processing to prevent race conditions
    const existing = await this.getPresentationByLectureId(lectureId);
    if (existing?.status === 'processing') {
      throw new Error('Презентация уже обрабатывается. Дождитесь завершения.');
    }

    let presentation;
    try {
      // Step 2: Upload to Storage
      const filePath = await this.uploadPresentationFile(file, lectureId);
      
      // Step 3: Upsert presentation record with status='processing'
      presentation = await this.upsertPresentation(lectureId, filePath);
      
      // Step 4: Trigger conversion via Edge Function
      await this.triggerConversion(lectureId);
      
      return presentation;
    } catch (error) {
      // Rollback: set status to error if conversion trigger failed
      if (presentation) {
        await this.updatePresentationStatus(
          presentation.id,
          'error',
          undefined,
          error instanceof Error ? error.message : 'Не удалось запустить конвертацию'
        ).catch(err => console.error('Failed to update error status:', err));
      }
      throw error;
    }
  },

  async deleteOldSlides(lectureId: string) {
    // Delete old slides before new conversion
    const { data: files } = await supabase.storage
      .from('presentations')
      .list(`${lectureId}/slides`);

    if (files && files.length > 0) {
      const filesToRemove = files.map(file => `${lectureId}/slides/${file.name}`);
      await supabase.storage
        .from('presentations')
        .remove(filesToRemove);
    }
  },

  async deletePresentation(lectureId: string) {
    // Get presentation data
    const presentation = await this.getPresentationByLectureId(lectureId);
    if (!presentation) return;

    // Delete all files from Storage
    const filesToDelete: string[] = [];
    
    // Add source PPTX
    if (presentation.file_path) {
      filesToDelete.push(presentation.file_path);
    }
    
    // Add all slide images
    if (presentation.slides_data?.slides) {
      presentation.slides_data.slides.forEach((slide: any) => {
        if (slide.path) filesToDelete.push(slide.path);
        if (slide.thumbPath) filesToDelete.push(slide.thumbPath);
      });
    }

    // Delete files from Storage
    if (filesToDelete.length > 0) {
      await supabase.storage
        .from('presentations')
        .remove(filesToDelete);
    }

    // Delete record from DB
    const { error } = await supabase
      .from('presentations')
      .delete()
      .eq('lecture_id', lectureId);

    if (error) throw error;
  },

  async replacePresentation(lectureId: string, file: File) {
    // Delete old presentation
    await this.deletePresentation(lectureId);
    
    // Upload and create new presentation
    return await this.uploadAndCreatePresentation(file, lectureId);
  },

  getSlideUrl(lectureId: string, slideIndex: number) {
    const paddedIndex = String(slideIndex).padStart(3, '0');
    const path = `${lectureId}/slides/${paddedIndex}.png`;
    return this.getPresentationUrl(path);
  },

  getThumbUrl(lectureId: string) {
    const path = `${lectureId}/thumb.png`;
    return this.getPresentationUrl(path);
  },
};
