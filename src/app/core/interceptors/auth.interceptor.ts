import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

const EXCLUDED_URL_ROOTS = [
  '/v1/api/user/', 
  '/v1/api/ubigeo/',
  '/v3/api-docs/',
  '/swagger-ui/'
];

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authToken = localStorage.getItem('token-local');
  let tokenToSend: string | null = null;

  
  const isExcluded = EXCLUDED_URL_ROOTS.some(root => req.url.includes(root));

  if (isExcluded || !authToken) {
    return next(req);
  }

  if (authToken) {
    try {
      
      const tokenObject = JSON.parse(authToken);
      
      tokenToSend = tokenObject.token; 
    } catch (e) {
      
      tokenToSend = authToken;
    }
    
    
    if (tokenToSend) {
      tokenToSend = tokenToSend.trim().replace(/\"|\\/g, '');
    }
  }

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${tokenToSend}`)
  });

  return next(authReq);
};