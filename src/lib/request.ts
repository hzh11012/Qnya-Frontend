import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse
} from 'axios';
import { toast } from 'sonner';

// 统一的响应数据结构
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface RequestConfig extends AxiosRequestConfig {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

class AxiosRequest {
  private instance: AxiosInstance;
  private readonly defaultTimeout = 30 * 1000;

  constructor(config?: AxiosRequestConfig) {
    this.instance = axios.create({
      timeout: this.defaultTimeout,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
      ...config
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      config => config,
      error => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const config = response.config as RequestConfig;
        const { message, data } = response.data;

        if (config.showSuccessToast) {
          toast.success(message);
        }

        return data;
      },
      error => {
        const config = error.config as RequestConfig;
        let errorMessage: string;

        if (error.response) {
          const { status: httpStatus, data } = error.response;
          errorMessage = data.message || '请求失败';

          // 当状态码为401时，跳转登录页
          if (httpStatus === 401) {
            // 使用自定义事件通知认证失效
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
        } else if (error.request) {
          errorMessage = '网络连接失败，请检查网络';
        } else {
          errorMessage = error.message || '请求失败';
        }

        if (config.showErrorToast) {
          toast.error(errorMessage);
        }
        return Promise.reject(error);
      }
    );
  }

  // GET 请求
  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  // POST 请求
  post<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.instance.post(url, data, config);
  }

  // PUT 请求
  put<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.instance.put(url, data, config);
  }

  // DELETE 请求
  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  // PATCH 请求
  patch<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.instance.patch(url, data, config);
  }
}

const request = new AxiosRequest();

export default request;
