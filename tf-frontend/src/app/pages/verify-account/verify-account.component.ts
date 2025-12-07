import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-account.component.html',
  styleUrls: ['./verify-account.component.css']
})
export class VerifyAccountComponent implements OnInit {
  email: string = '';
  verificationCode: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  resending: boolean = false;
  countdown: number = 0;
  countdownInterval: any;

  // 🆕 Control de cooldown para reenvío de código
  canResend: boolean = true;
  resendCooldown: number = 0;
  resendCooldownInterval: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Obtener email de query params
    this.email = this.route.snapshot.queryParams['email'] || '';

    if (!this.email) {
      this.errorMessage = 'Email no proporcionado. Regresa al registro.';
    }

    // Iniciar countdown de 15 minutos
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.resendCooldownInterval) {
      clearInterval(this.resendCooldownInterval);
    }
  }

  startCountdown() {
    this.countdown = 15 * 60; // 15 minutos en segundos
    
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.errorMessage = 'El código ha expirado. Solicita uno nuevo.';
      }
    }, 1000);
  }

  formatCountdown(): string {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onVerificationCodeInput(event: any) {
    // Solo permitir números y limitar a 6 dígitos
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.verificationCode = value.substring(0, 6);
    event.target.value = this.verificationCode;
  }

  verifyEmail() {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.errorMessage = 'Ingresa el código de 6 dígitos';
      return;
    }

    if (!this.email) {
      this.errorMessage = 'Email no válido';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.completeRegistration(this.email, this.verificationCode).subscribe({
      next: (response) => {
        console.log('✅ Registro completado:', response);
        
        // Limpiar countdown
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
        
        alert('¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('❌ Error verificando:', error);
        this.loading = false;
        
        if (error.status === 400) {
          this.errorMessage = error.error?.detail || 'Código inválido o expirado';
        } else {
          this.errorMessage = 'Error inesperado. Intenta nuevamente.';
        }
      }
    });
  }

  resendCode() {
    if (!this.email) {
      this.errorMessage = 'Email no válido para reenvío';
      return;
    }

    if (!this.canResend) {
      this.errorMessage = `Debes esperar ${this.formatResendCooldown()} antes de reenviar`;
      return;
    }

    this.resending = true;
    this.errorMessage = '';

    this.authService.resendVerificationCode(this.email).subscribe({
      next: (response) => {
        console.log('✅ Código reenviado:', response);
        this.resending = false;

        // Reiniciar countdown de expiración
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
        this.startCountdown();

        // 🆕 Iniciar cooldown de 2 minutos para reenvío
        const cooldownSeconds = response.cooldown_seconds || 120;
        this.startResendCooldown(cooldownSeconds);

        alert('Código reenviado a tu email');
      },
      error: (error) => {
        console.error('❌ Error reenviando:', error);
        this.resending = false;

        // Manejar error 429 (Too Many Requests) con cooldown
        if (error.status === 429) {
          const retryAfter = error.headers?.get('Retry-After');
          const cooldownSeconds = retryAfter ? parseInt(retryAfter) : 120;

          this.startResendCooldown(cooldownSeconds);
          this.errorMessage = error.error?.detail || 'Debes esperar antes de reenviar el código';
        } else {
          this.errorMessage = error.error?.detail || 'Error reenviando código';
        }
      }
    });
  }

  // 🆕 Iniciar countdown de cooldown para reenvío
  startResendCooldown(seconds: number) {
    this.canResend = false;
    this.resendCooldown = seconds;

    // Limpiar intervalo anterior si existe
    if (this.resendCooldownInterval) {
      clearInterval(this.resendCooldownInterval);
    }

    this.resendCooldownInterval = setInterval(() => {
      this.resendCooldown--;

      if (this.resendCooldown <= 0) {
        clearInterval(this.resendCooldownInterval);
        this.canResend = true;
        this.resendCooldown = 0;
      }
    }, 1000);
  }

  // 🆕 Formatear tiempo restante de cooldown
  formatResendCooldown(): string {
    const minutes = Math.floor(this.resendCooldown / 60);
    const seconds = this.resendCooldown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  goBackToRegister() {
    this.router.navigate(['/user-config']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}