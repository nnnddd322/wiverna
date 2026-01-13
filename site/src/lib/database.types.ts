export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'student' | 'teacher' | 'admin'
          first_name: string
          last_name: string
          group_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'student' | 'teacher' | 'admin'
          first_name: string
          last_name: string
          group_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'student' | 'teacher' | 'admin'
          first_name?: string
          last_name?: string
          group_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      disciplines: {
        Row: {
          id: string
          title: string
          description: string
          icon: string | null
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon?: string | null
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon?: string | null
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      discipline_access: {
        Row: {
          id: string
          discipline_id: string
          student_id: string | null
          group_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          discipline_id: string
          student_id?: string | null
          group_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          discipline_id?: string
          student_id?: string | null
          group_id?: string | null
          created_at?: string
        }
      }
      lectures: {
        Row: {
          id: string
          discipline_id: string
          title: string
          content: Json
          type: 'article' | 'presentation' | 'test'
          status: 'draft' | 'published'
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          discipline_id: string
          title: string
          content?: Json
          type: 'article' | 'presentation' | 'test'
          status?: 'draft' | 'published'
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discipline_id?: string
          title?: string
          content?: Json
          type?: 'article' | 'presentation' | 'test'
          status?: 'draft' | 'published'
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      presentations: {
        Row: {
          id: string
          lecture_id: string
          file_path: string
          slides_data: Json | null
          status: 'processing' | 'ready' | 'error'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lecture_id: string
          file_path: string
          slides_data?: Json | null
          status?: 'processing' | 'ready' | 'error'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lecture_id?: string
          file_path?: string
          slides_data?: Json | null
          status?: 'processing' | 'ready' | 'error'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          lecture_id: string
          questions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lecture_id: string
          questions: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lecture_id?: string
          questions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      student_progress: {
        Row: {
          id: string
          student_id: string
          lecture_id: string
          completed: boolean
          score: number | null
          last_accessed: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          lecture_id: string
          completed?: boolean
          score?: number | null
          last_accessed?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          lecture_id?: string
          completed?: boolean
          score?: number | null
          last_accessed?: string
          created_at?: string
          updated_at?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
