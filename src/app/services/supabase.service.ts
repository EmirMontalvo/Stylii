import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Reemplaza con tus credenciales de Supabase
  private supabaseUrl = 'https://djrxeslbhnguquigqguk.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcnhlc2xiaG5ndXF1aWdxZ3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzcyMDYsImV4cCI6MjA5MTM1MzIwNn0.tzcLigrZ6mhs1XVMb_cjIOmhkvNU66jaCYR_bw3lJlg';

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  get client() {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }
}
