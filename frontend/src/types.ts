export interface Document {
  id: string;
  filename: string;
  filepath: string;
  file_hash: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  extracted_text?: string;
  extraction_method?: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

export interface ExtractedCandidate {
  document_id: string;
  filename: string;
  merchant?: string;
  date?: string;
  total?: string;
  currency: string;
  tax?: string;
  invoice_number?: string;
  suggested_category: string;
  category_confidence: number;
  category_reasoning?: string;
  uncertain_fields: string[];
  raw_text_snippet?: string;
  is_duplicate: boolean;
  duplicate_reason?: string;
  duplicate_of_id?: string;
}

export interface Transaction {
  id: string;
  document_id?: string;
  merchant: string;
  date: string;
  total: string;
  currency: string;
  tax?: string;
  invoice_number?: string;
  category: string;
  suggested_category?: string;
  category_confidence?: number;
  category_reasoning?: string;
  notes?: string;
  is_approved: boolean;
  is_duplicate: boolean;
  duplicate_of_id?: string;
  duplicate_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CategorySummary {
  category: string;
  total_amount: string;
  percentage: number;
  transaction_count: number;
}

export interface MonthlyTrend {
  month: string;
  total_amount: string;
  transaction_count: number;
}

export interface MerchantSummary {
  merchant: string;
  total_amount: string;
  transaction_count: number;
}

export interface OverviewReport {
  total_spend: string;
  total_transactions: number;
  approved_count: number;
  pending_count: number;
  duplicate_count: number;
  categories_breakdown: CategorySummary[];
  monthly_trends: MonthlyTrend[];
  top_merchants: MerchantSummary[];
  currency: string;
}

export interface ParsedQueryIntent {
  intent_type: string;
  category?: string;
  merchant?: string;
  month?: string;
  start_date?: string;
  end_date?: string;
}

export interface NLQueryResponse {
  query: string;
  parsed_intent: ParsedQueryIntent;
  answer: string;
  calculated_total?: string;
  currency: string;
  matched_count: number;
  matched_transactions: Array<{
    id: string;
    merchant: string;
    date: string;
    total: string;
    category: string;
    currency: string;
    invoice_number?: string;
    notes?: string;
  }>;
  model_used?: string;
  is_llm_assisted: boolean;
  warning?: string;
}

export interface OllamaStatus {
  available: boolean;
  base_url: string;
  configured_model: string;
  available_models: string[];
  latency_ms?: number;
  message: string;
}

export interface AppSettings {
  ollama_base_url: string;
  ollama_model: string;
  default_currency: string;
  auto_suggest_categories: boolean;
}

export interface SystemHealth {
  status: string;
  database_ok: boolean;
  document_count: number;
  transaction_count: number;
  approved_count: number;
  ollama_status: OllamaStatus;
  storage_path: string;
}
