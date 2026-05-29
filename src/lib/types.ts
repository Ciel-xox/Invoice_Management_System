export type Company = {
  id: string;
  name: string;
  contact_email: string; // 企業担当者のメールアドレス（URL 配布・通知用）
  token: string;
  drive_folder_id: string | null; // 自動作成された Drive フォルダ ID
  drive_folder_name: string; // 表示用（企業名から自動生成）
  status: "active" | "disabled";
  created_at: string;
};

export type UploadStatus = "uploading" | "done" | "review" | "failed";

export type Upload = {
  id: string;
  company_id: string;
  company_name: string;
  uploader_name: string;
  uploader_email: string;
  invoice_month: string | null;
  invoice_amount: number | null;
  filename: string;
  blob_url: string;
  drive_file_id: string | null;
  drive_file_url: string | null;
  status: UploadStatus;
  note: string | null;
  created_at: string;
};
