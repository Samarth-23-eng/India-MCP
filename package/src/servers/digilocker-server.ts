import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { BaseMCPServer } from '../shared/base-server.js';

const RequestSchema = z;

const DIGILOCKER_BASE_URL = 'https://api.digitallocker.gov.in/public/oauth2/1';
const DIGILOCKER_AUTH_URL = 'https://api.digitallocker.gov.in/public/oauth2/1/authorize';
const DIGILOCKER_TOKEN_URL = 'https://api.digitallocker.gov.in/public/oauth2/1/token';

interface DigiLockerConfig {
  clientId: string;
  clientSecret: string;
}

function getConfig(): DigiLockerConfig {
  const clientId = process.env.DIGILOCKER_CLIENT_ID;
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error(
      'DIGILOCKER_CLIENT_ID and DIGILOCKER_CLIENT_SECRET environment variables are required. ' +
      'Register at https://digitallocker.gov.in/developer/ for API credentials.'
    );
  }
  
  return { clientId, clientSecret };
}

function getAccessToken(): string | null {
  return process.env.DIGILOCKER_ACCESS_TOKEN || null;
}

export class DigiLockerServer extends BaseMCPServer {
  constructor() {
    super('digilocker-server', '1.0.0');
  }

  protected tools = [
    {
      name: 'get_oauth_url',
      description: 'Generate the DigiLocker OAuth authorization URL to get user consent for accessing their documents',
      inputSchema: RequestSchema.object({
        redirect_uri: z.string().url('Must be a valid URL'),
        state: z.string().optional(),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const config = getConfig();
        const redirectUri = args.redirect_uri as string;
        const state = args.state as string | undefined;
        
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: redirectUri,
          scope: 'files.field.read',
        });
        
        if (state) {
          params.append('state', state);
        }
        
        const authUrl = `${DIGILOCKER_AUTH_URL}?${params.toString()}`;
        
        return {
          auth_url: authUrl,
          state: state || null,
          instructions: 'Share this URL with the user. After they authorize, you will receive a code at the redirect_uri.',
          note: 'The code expires in 5 minutes. Exchange it quickly using exchange_auth_code tool.',
        };
      },
    },
    {
      name: 'exchange_auth_code',
      description: 'Exchange an OAuth authorization code for an access token after user grants permission',
      inputSchema: RequestSchema.object({
        code: z.string().min(10, 'Authorization code is required'),
        redirect_uri: z.string().url('Must be a valid URL'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const config = getConfig();
        const code = args.code as string;
        const redirectUri = args.redirect_uri as string;
        
        try {
          const response = await axios.post(
            DIGILOCKER_TOKEN_URL,
            new URLSearchParams({
              code: code,
              grant_type: 'authorization_code',
              client_id: config.clientId,
              client_secret: config.clientSecret,
              redirect_uri: redirectUri,
            }).toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: 15000,
            }
          );
          
          const data = response.data;
          
          if (data.error) {
            return {
              error: data.error,
              error_description: data.error_description || 'Failed to exchange code',
              hint: 'Codes expire after 5 minutes. Generate a fresh authorization URL and try again.',
            };
          }
          
          return {
            access_token: data.access_token,
            token_type: data.token_type || 'Bearer',
            expires_in: data.expires_in || 3600,
            refresh_token: data.refresh_token || null,
            scope: data.scope || 'files.field.read',
            hint: 'Store the access_token securely. Use it for all authenticated API calls. Use refresh_token to get new access tokens.',
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response) {
            const responseData = axiosError.response.data as any;
            return {
              error: 'token_exchange_failed',
              error_description: responseData?.error_description || 'Failed to exchange authorization code',
              hint: 'Authorization codes expire after 5 minutes. Generate a fresh URL and complete authorization quickly.',
            };
          }
          return {
            error: 'network_error',
            message: axiosError.message,
          };
        }
      },
    },
    {
      name: 'list_issued_documents',
      description: 'List all documents issued to a DigiLocker user (requires user access token)',
      inputSchema: RequestSchema.object({
        access_token: z.string().min(20, 'Valid access token required'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const accessToken = args.access_token as string;
        
        try {
          const response = await axios.get(
            `${DIGILOCKER_BASE_URL}/files/issued`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
              timeout: 15000,
            }
          );
          
          const data = response.data;
          
          if (data.error) {
            return {
              error: data.error,
              message: data.error_description || 'Failed to fetch documents',
            };
          }
          
          let documents = [];
          
          if (Array.isArray(data)) {
            documents = data;
          } else if (data.documents && Array.isArray(data.documents)) {
            documents = data.documents;
          } else if (data.results && Array.isArray(data.results)) {
            documents = data.results;
          }
          
          if (documents.length === 0) {
            return {
              documents: [],
              message: 'No documents found. The user may not have any documents stored in DigiLocker yet.',
              suggestions: [
                'Documents from government agencies (Aadhaar, PAN, driving license, vehicle registration) are automatically linked.',
                'Users can upload documents manually via the DigiLocker app.',
              ],
            };
          }
          
          return {
            documents: documents.map((doc: any) => ({
              name: doc.name || doc.doc_name || doc.file_name,
              type: doc.type || doc.doctype || doc.doc_type,
              issuer: doc.issuer || doc.issuing_authority || 'Unknown',
              issue_date: doc.issue_date || doc.date_of_issue || doc.created_at,
              doctype: doc.doctype || doc.doc_type || 'Other',
              uri: doc.uri || doc.file_uri || doc.link,
              size: doc.size || null,
            })),
            count: documents.length,
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            return {
              error: 'token_expired',
              message: 'Access token has expired',
              hint: 'Use get_oauth_url to generate a new authorization URL, or implement refresh token flow.',
            };
          }
          if (axiosError.response?.status === 429) {
            const retryAfter = axiosError.response.headers['retry-after'];
            return {
              error: 'rate_limit_exceeded',
              message: 'Too many requests',
              retry_after: retryAfter || 60,
              hint: `Wait ${retryAfter || 60} seconds before retrying`,
            };
          }
          return {
            error: 'api_error',
            message: axiosError.message,
          };
        }
      },
    },
    {
      name: 'get_document',
      description: 'Fetch a specific document from DigiLocker by its URI (requires user access token)',
      inputSchema: RequestSchema.object({
        access_token: z.string().min(20, 'Valid access token required'),
        document_uri: z.string().min(5, 'Document URI required'),
        format: z.enum(['json', 'xml', 'pdf']).optional(),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const accessToken = args.access_token as string;
        const documentUri = args.document_uri as string;
        const format = (args.format as 'json' | 'xml' | 'pdf') || 'json';
        
        try {
          const endpoint = format === 'pdf' 
            ? `${DIGILOCKER_BASE_URL}/pdf/${documentUri}`
            : format === 'xml'
            ? `${DIGILOCKER_BASE_URL}/xml/${documentUri}`
            : `${DIGILOCKER_BASE_URL}/${documentUri}`;
          
          const response = await axios.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            timeout: 30000,
            responseType: format === 'pdf' ? 'arraybuffer' : 'text',
          });
          
          if (format === 'pdf') {
            const base64 = Buffer.from(response.data as Buffer).toString('base64');
            return {
              content: base64,
              format: 'pdf',
              content_type: 'application/pdf',
              size: (response.data as Buffer).length,
            };
          }
          
          const content = response.data;
          
          if (typeof content === 'object' && content.error) {
            return {
              error: content.error,
              message: content.error_description || 'Failed to fetch document',
            };
          }
          
          return {
            content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
            format: format,
            content_type: format === 'xml' ? 'application/xml' : 'application/json',
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            return {
              error: 'token_expired',
              hint: 'Generate a new access token using the OAuth flow',
            };
          }
          if (axiosError.response?.status === 404) {
            return {
              error: 'document_not_found',
              document_uri: documentUri,
              hint: 'Verify the document URI. It may have expired or been deleted.',
            };
          }
          if (axiosError.response?.status === 429) {
            return {
              error: 'rate_limit_exceeded',
              retry_after: axiosError.response.headers['retry-after'] || 60,
            };
          }
          return {
            error: 'api_error',
            message: axiosError.message,
          };
        }
      },
    },
    {
      name: 'verify_aadhaar_seeding',
      description: 'Check if a DigiLocker account has Aadhaar seeded/linked (public verification)',
      inputSchema: RequestSchema.object({
        access_token: z.string().min(20, 'Valid access token required'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const accessToken = args.access_token as string;
        
        try {
          const response = await axios.get(
            `${DIGILOCKER_BASE_URL}/user`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
              timeout: 15000,
            }
          );
          
          const data = response.data;
          
          if (data.error) {
            return {
              error: data.error,
              message: data.error_description || 'Failed to fetch user info',
            };
          }
          
          return {
            name: data.name || data.user_name || null,
            dob: data.dob || data.date_of_birth || null,
            gender: data.gender || null,
            aadhaar_linked: data.aadhaar_linked !== false && data.aadhaar_status !== 'Not Linked',
            aadhaar_status: data.aadhaar_status || (data.aadhaar_linked ? 'Linked' : 'Not Linked'),
            mobile_verified: data.mobile_verified === true || data.is_mobile_verified === true,
            email_verified: data.email_verified === true || data.is_email_verified === true,
            digilocker_id: data.digilocker_id || data.id || null,
            profile_created: data.profile_created || data.created_at || null,
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            return {
              error: 'token_expired',
              message: 'Access token has expired',
              hint: 'Re-authenticate using get_oauth_url',
            };
          }
          return {
            error: 'api_error',
            message: axiosError.message,
          };
        }
      },
    },
  ];
}