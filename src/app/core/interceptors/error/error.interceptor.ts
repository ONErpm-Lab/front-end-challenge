import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar'
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError(error => {
      let errorMessage = 'Ocorreu um erro inesperado. Por favor, tente novamente.';
      let snackbarClass = 'snackbar-error';

      if (error.status) {
        switch (error.status) {
          case 400: // Bad Request
            errorMessage = error.error?.message || 'Dados inválidos na requisição.';
            snackbarClass = 'snackbar-warning';
            break;
          case 401: // Unauthorized
            errorMessage = 'Sua sessão expirou ou você não está autorizado. Favor acessar a url novamente.';
            break;
          case 403: // Forbidden
            errorMessage = 'Você não tem permissão para acessar este recurso.';
            break;
          case 404: // Not Found
            errorMessage = 'O recurso solicitado não foi encontrado.';
            snackbarClass = 'snackbar-warning';
            break;
          case 500: // Internal Server Error
            errorMessage = 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.';
            break;
          default:
            errorMessage = `Erro ${error.status}: ${error.error?.message || error.statusText || 'Detalhes desconhecidos.'}`;
            break;
        }
      } else if (error.message) {
        errorMessage = `Erro de rede: ${error.message}. Verifique sua conexão.`;
        snackbarClass = 'snackbar-critical';
      }

      snackBar.open(errorMessage, 'Fechar', {
        duration: 5000,
        panelClass: [snackbarClass],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      return throwError(() => error);
    })
  );
};
