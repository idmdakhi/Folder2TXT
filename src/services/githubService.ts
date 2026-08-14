// src/services/githubService.ts
// سرویس آپلود به GitHub Gist

import axios from 'axios';

export interface GistUploadOptions {
  token: string;
  description?: string;
  public?: boolean;
  filename?: string;
}

export interface GistUploadResult {
  success: boolean;
  gistId?: string;
  gistUrl?: string;
  error?: string;
}

/**
 * آپلود محتوا به GitHub Gist
 */
export async function uploadToGist(
  content: string,
  options: GistUploadOptions
): Promise<GistUploadResult> {
  try {
    const { token, description = 'Project export via folder2text', public: isPublic = false, filename = 'project-export.txt' } = options;

    // اعتبارسنجی توکن
    if (!token || token.length < 10) {
      return {
        success: false,
        error: 'Invalid GitHub token. Please provide a valid personal access token.'
      };
    }

    // آماده‌سازی درخواست
    const gistData = {
      description,
      public: isPublic,
      files: {
        [filename]: {
          content
        }
      }
    };

    // ارسال درخواست به GitHub API
    const response = await axios.post<any>(
      'https://api.github.com/gists',
      gistData,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'folder2text-cli'
        }
      }
    );

    if (response.status === 201 && response.data.id) {
      return {
        success: true,
        gistId: response.data.id as string,
        gistUrl: response.data.html_url as string
      };
    }

    return {
      success: false,
      error: 'Failed to create Gist. Response status: ' + response.status
    };

  } catch (error: any) {
    let errorMessage = 'Unknown error occurred';
    
    if (error.response) {
      // خطای HTTP از سمت GitHub
      if (error.response.status === 401) {
        errorMessage = 'Invalid or expired GitHub token. Please check your token and try again.';
      } else if (error.response.status === 403) {
        errorMessage = 'Token does not have permission to create Gists. Please ensure the "gist" scope is enabled.';
      } else if (error.response.status === 422) {
        errorMessage = 'Invalid request. The content may be too large or contain invalid characters.';
      } else {
        errorMessage = `GitHub API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.request) {
      // درخواست ارسال شد اما پاسخی دریافت نشد
      errorMessage = 'Network error. Could not reach GitHub API. Please check your internet connection.';
    } else {
      // خطای دیگر
      errorMessage = error.message || 'An unexpected error occurred';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * بررسی اعتبار توکن GitHub
 */
export async function validateGithubToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const response = await axios.get<any>('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'folder2text-cli'
      }
    });

    if (response.status === 200 && response.data.login) {
      return {
        valid: true,
        username: response.data.login as string
      };
    }

    return { valid: false };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * آپلود چندین فایل به صورت Gist چند فایلی
 */
export async function uploadMultipleFilesToGist(
  files: Array<{ filename: string; content: string }>,
  options: GistUploadOptions
): Promise<GistUploadResult> {
  try {
    const { token, description = 'Project export via folder2text', public: isPublic = false } = options;

    if (!token || token.length < 10) {
      return {
        success: false,
        error: 'Invalid GitHub token.'
      };
    }

    if (files.length === 0) {
      return {
        success: false,
        error: 'No files to upload.'
      };
    }

    // محدودیت GitHub: حداکثر ۱۰۰ فایل در هر Gist
    if (files.length > 100) {
      return {
        success: false,
        error: 'GitHub Gist supports maximum 100 files. Please reduce the number of files.'
      };
    }

    const gistFiles: Record<string, { content: string }> = {};
    for (const file of files) {
      gistFiles[file.filename] = { content: file.content };
    }

    const gistData = {
      description,
      public: isPublic,
      files: gistFiles
    };

    const response = await axios.post<any>(
      'https://api.github.com/gists',
      gistData,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'folder2text-cli'
        }
      }
    );

    if (response.status === 201 && response.data.id) {
      return {
        success: true,
        gistId: response.data.id as string,
        gistUrl: response.data.html_url as string
      };
    }

    return {
      success: false,
      error: 'Failed to create Gist.'
    };

  } catch (error: any) {
    let errorMessage = 'Unknown error occurred';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Invalid or expired GitHub token.';
      } else if (error.response.status === 403) {
        errorMessage = 'Token does not have gist permission.';
      } else if (error.response.status === 422) {
        errorMessage = 'Invalid request or content too large.';
      } else {
        errorMessage = `GitHub API error: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Could not reach GitHub API.';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}
