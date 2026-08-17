import { DriveFileItem } from '../types';

/**
 * List PDF files and documents from the user's Google Drive.
 */
export async function listDrivePdfFiles(
  token: string,
  searchQuery = ''
): Promise<DriveFileItem[]> {
  try {
    let query = "trashed = false and mimeType = 'application/pdf'";
    if (searchQuery.trim()) {
      const sanitized = searchQuery.replace(/'/g, "\\'");
      query += ` and name contains '${sanitized}'`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: '50',
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('انتهت صلاحية جلسة Google Drive. يرجى إعادة تسجيل الدخول.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'فشل في استرجاع الملفات من Google Drive.');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Error fetching files from Google Drive:', error);
    throw error;
  }
}

/**
 * Download a PDF file from Google Drive and return it as a native File instance
 */
export async function downloadDrivePdfAsFile(
  token: string,
  fileId: string,
  fileName: string
): Promise<File> {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('انتهت صلاحية جلسة Google Drive. يرجى تسجيل الدخول مجدداً.');
    }

    if (!response.ok) {
      throw new Error('تعذر تحميل ملف الـ PDF من Google Drive.');
    }

    const blob = await response.blob();
    const finalName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    return new File([blob], finalName, { type: 'application/pdf' });
  } catch (error: any) {
    console.error('Error downloading PDF from Google Drive:', error);
    throw error;
  }
}

/**
 * Save / Export analysis report to user's Google Drive as a Markdown / Text report
 */
export async function uploadReportToDrive(
  token: string,
  fileName: string,
  content: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  try {
    const metadata = {
      name: fileName.endsWith('.md') ? fileName : `${fileName}.md`,
      mimeType: 'text/markdown',
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', new Blob([content], { type: 'text/markdown;charset=utf-8' }));

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    if (response.status === 401) {
      throw new Error('انتهت صلاحية جلسة Google Drive. يرجى تسجيل الدخول مجدداً.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'فشل في حفظ التقرير في Google Drive.');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error uploading report to Google Drive:', error);
    throw error;
  }
}
