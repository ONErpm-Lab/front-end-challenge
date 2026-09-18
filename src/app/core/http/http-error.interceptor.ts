import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { appError, type AppError } from '../errors/app-error';

/**
 * The single place where HTTP failure becomes {@link AppError}.
 *
 * Keeping this mapping in exactly one interceptor is the DRY half; the SRP half is
 * that no service, repository or component below it ever touches `HttpErrorResponse`.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(catchError((error: unknown) => throwError(() => toAppError(error))));

function toAppError(error: unknown): AppError {
  if (!(error instanceof HttpErrorResponse)) {
    return appError('unknown', 'Ocorreu um erro inesperado.', error);
  }

  // status 0 means the request never completed: offline, CORS, or the proxy is down.
  if (error.status === 0) {
    return appError('network', 'Não foi possível conectar ao serviço de faixas.', error);
  }

  switch (error.status) {
    case 401:
    case 403:
      return appError('auth', 'Não foi possível autenticar no provedor de faixas.', error);
    case 404:
      return appError('notFound', 'Faixa não encontrada.', error);
    case 429:
      return appError('rateLimited', 'Muitas requisições. Tente novamente em instantes.', error);
    default:
      return error.status >= 500
        ? appError('provider', 'O provedor de faixas está indisponível no momento.', error)
        : appError('unknown', 'Ocorreu um erro inesperado.', error);
  }
}
